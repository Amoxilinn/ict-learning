"""Regression tests for actual validator failure modes."""
import copy
import json
import pathlib
import unittest
import tempfile
from unittest.mock import patch
import validate_rewrite
from validate_glossary import validate

P = pathlib.Path(__file__).resolve().parent.parent


class GlossaryValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.merged = json.loads((P / 'content/glossary.json').read_text())
        cls.additions = json.loads((P / 'content/rewrite/out/glossary.json').read_text())
        cls.sources = json.loads((P / 'content/rewrite/glossary-source.json').read_text())

    def errors(self, merged):
        return validate(merged, self.additions, self.sources)[0]

    def test_merged_library_is_not_its_own_baseline(self):
        self.assertEqual(self.errors(self.merged), [])

    def test_real_cross_entry_alias_collision_is_rejected(self):
        bad = copy.deepcopy(self.merged)
        bad[0]['terms'].append(bad[-1]['terms'][0])
        self.assertTrue(any('duplicate alias' in e for e in self.errors(bad)))

    def test_duplicate_ids_are_rejected(self):
        self.assertTrue(any('duplicate library id' in e for e in self.errors(self.merged + [self.merged[0]])))

    def test_missing_and_changed_additions_are_rejected(self):
        self.assertTrue(any('missing merged' in e for e in self.errors(self.merged[:-1])))
        bad = copy.deepcopy(self.merged)
        bad[-1]['hint'] = '被意外覆盖'
        self.assertTrue(any('differs' in e for e in self.errors(bad)))

    def test_explicit_baseline_is_preserved(self):
        baseline = [self.merged[0]]
        bad = copy.deepcopy(self.merged)
        bad[0]['hint'] += '改动'
        self.assertTrue(any('baseline' in e for e in validate(bad, self.additions, self.sources, baseline)[0]))


class RewriteValidationTests(unittest.TestCase):
    def check_goal(self, goal):
        source = json.loads((P / 'content/rewrite/source/batch-00.json').read_text())
        output = json.loads((P / 'content/rewrite/out/batch-00.json').read_text())
        next(iter(output['units'].values()))['goal'] = goal
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            for name, data in [('source', source), ('out', output)]:
                path = root / 'content/rewrite' / name / 'batch-00.json'
                path.parent.mkdir(parents=True)
                path.write_text(json.dumps(data))
            with patch.object(validate_rewrite, 'P', root):
                return validate_rewrite.check_batch('batch-00')

    def test_short_goal_reports_error_instead_of_name_error(self):
        errors, _, _ = self.check_goal('短')
        self.assertTrue(any('goal too short' in e for e in errors))

    def test_long_goal_reports_warning_instead_of_name_error(self):
        _, warnings, _ = self.check_goal('目标' * 40)
        self.assertTrue(any('goal longer than' in e for e in warnings))


if __name__ == '__main__':
    unittest.main()
