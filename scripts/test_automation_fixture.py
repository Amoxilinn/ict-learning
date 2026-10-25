"""Failures must leave an explicit, verifiable state. No network driver is used."""
import importlib.util
import pathlib
import unittest

path = pathlib.Path(__file__).resolve().parents[1] / 'dist/labs/automation_fixture.py'
spec = importlib.util.spec_from_file_location('fixture', path)
fixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)

class FixtureTest(unittest.TestCase):
    def test_success_and_idempotence(self):
        state = {'description': 'OLD'}
        output, success = fixture.reconcile(state, 'LAB-UPLINK')
        self.assertTrue(success)
        self.assertEqual(state['description'], 'LAB-UPLINK')
        self.assertIn('VERIFY PASS', output)
        self.assertIn('NO_CHANGE changed=false', fixture.reconcile(state, 'LAB-UPLINK')[0])

    def test_timeout_no_mutation(self):
        state = {'description': 'OLD'}
        self.assertFalse(fixture.reconcile(state, 'NEW', 'timeout')[1])
        self.assertEqual(state['description'], 'OLD')

    def test_drift_verified_rollback(self):
        state = {'description': 'OLD'}
        output, success = fixture.reconcile(state, 'NEW', 'drift')
        self.assertFalse(success)
        self.assertIn('ROLLBACK verified=OLD', output)
        self.assertEqual(state['description'], 'OLD')

    def test_rollback_failure_is_not_success(self):
        state = {'description': 'OLD'}
        output, success = fixture.reconcile(state, 'NEW', 'rollback-fail')
        self.assertFalse(success)
        self.assertIn('ROLLBACK_FAIL manual_recovery_required=true', output)
        self.assertEqual(state['description'], 'DRIFT')

    def test_inventory_rejected_before_action(self):
        for inventory in [[], [{'name':'r','address':'999.0.0.1'}], [{'name':'r','address':'192.0.2.1'}, {'name':'r','address':'192.0.2.2'}], [{'name':'r','address':'192.0.2.1'}, {'name':'s','address':'192.0.2.1'}]]:
            with self.assertRaises(ValueError): fixture.validate(inventory)

if __name__ == '__main__':
    unittest.main()
