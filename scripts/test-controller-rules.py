"""Regression checks for the actual boolean output expressions embedded in YAML.
Run: python scripts/test-controller-rules.py
This does not replace ESPHome compilation or hardware testing.
"""
from pathlib import Path
import itertools
import re
import unittest

SOURCE=(Path(__file__).resolve().parents[1]/'esphome'/'pond-controller-v2.yaml').read_text(encoding='utf-8')

def expression(name, **values):
    match=re.search(r'const bool '+name+r'\s*=([^;]+);',SOURCE)
    if not match:
        raise AssertionError('Missing controller expression: '+name)
    text=match.group(1).strip()
    if '?' in text:
        condition, branches=text.split('?',1)
        yes,no=branches.split(':',1)
        text=f'({yes}) if ({condition}) else ({no})'
    text=text.replace('&&',' and ').replace('||',' or ')
    text=re.sub(r'!(?!=)','not ',text)
    return bool(eval(text,{'__builtins__':{}},values))

class ControllerRules(unittest.TestCase):
    def test_air_winter_policy_and_manual_modes(self):
        for winter,policy,scheduled,mode in itertools.product([False,True],range(3),[False,True],range(3)):
            with self.subTest(winter=winter,policy=policy,scheduled=scheduled,mode=mode):
                auto=expression('aer_auto',winter=winter,winter_policy=policy,aer_scheduled=scheduled)
                result=expression('aer',am=mode,aer_auto=auto)
                expected=(mode==1) or (mode==0 and (scheduled if not winter or policy==1 else policy==0))
                self.assertEqual(result,expected)
    def test_filter_manual_on_never_bypasses_safety(self):
        for safe,mode,scheduled in itertools.product([False,True],range(3),[False,True]):
            result=expression('pump',safe=safe,pm=mode,pump_scheduled=scheduled)
            self.assertEqual(result,safe and (mode==1 or (mode==0 and scheduled)))
    def test_uv_always_requires_filter(self):
        for pump,mode,scheduled in itertools.product([False,True],range(3),[False,True]):
            result=expression('uv',pump=pump,um=mode,uv_scheduled=scheduled)
            self.assertEqual(result,pump and (mode==1 or (mode==0 and scheduled)))
    def test_skimmer_manual_on_never_bypasses_safety(self):
        for safe,mode,scheduled in itertools.product([False,True],range(3),[False,True]):
            requested=expression('requested',sm=mode,skimmer_scheduled=scheduled)
            result=expression('skim',requested=requested,skim_safe=safe)
            self.assertEqual(result,safe and (mode==1 or (mode==0 and scheduled)))
    def test_ids_and_visible_defaults(self):
        ids=set(re.findall(r'^\s+-?\s*id:\s*(\w+)\s*(?:#.*)?$',SOURCE,re.M))
        refs=set(re.findall(r'\bid\((\w+)\)',SOURCE))
        self.assertFalse(refs-ids)
        for prefix in ['skimmer','aer']:
            for suffix,value in [('run_minutes','15'),('every_hours','6'),('every_minutes','0')]:
                block=re.search(r'    id: '+prefix+'_'+suffix+r'\n(.*?)(?=  - platform:|\Z)',SOURCE,re.S).group(1)
                self.assertRegex(block,r'initial_value: '+value+r'\n')
            block=re.search(r'    id: '+prefix+r'_schedule\n(.*?)(?=  - platform:|\Z)',SOURCE,re.S).group(1)
            self.assertIn('initial_option: "Gentag med interval"',block)
        for prefix in ['pump','skimmer','aer','uv']:
            self.assertIn(prefix+'_control_reason',ids)
            self.assertIn(prefix+'_auto_rule',ids)
        self.assertIn('sensor_timeout_seconds',ids)
        self.assertIn('am==0 && (!winter || winter_policy==1)',SOURCE)
        self.assertNotIn('level_margin',SOURCE)
        for line in SOURCE.splitlines():
            if re.match(r'\s*(key|password):',line):
                self.assertIn('!secret ',line)

if __name__=='__main__':
    unittest.main()
