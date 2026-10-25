# -*- coding: utf-8 -*-
"""Validate the current library and its authored additions without resetting files."""
import argparse
import collections
import json
import pathlib
import sys

P = pathlib.Path(__file__).resolve().parent.parent


def validate(merged, additions, sources, baseline=None):
    errors = []
    warnings = []
    expected = {x['id'] for x in sources}
    added_ids = [x['id'] for x in additions]
    ids = [x['id'] for x in merged]
    for name, values in [('library', ids), ('additions', added_ids)]:
        for key, count in collections.Counter(values).items():
            if count > 1:
                errors.append(f'duplicate {name} id: {key}')
    for key in sorted(expected - set(added_ids)):
        errors.append('missing addition ' + key)
    for key in sorted(set(added_ids) - expected):
        errors.append('unknown addition ' + key)
    for name, entries in [('library', merged), ('additions', additions)]:
        owners = {}
        for entry in entries:
            key = entry['id']
            terms = entry.get('terms')
            if not isinstance(terms, list) or not terms or any(not isinstance(t, str) or len(t) < (2 if name == 'additions' else 1) for t in terms):
                errors.append(f'{name} {key}: bad terms')
                continue
            for term in terms:
                if term in owners:
                    errors.append(f'{name}: duplicate alias {term} ({owners[term]}, {key})')
                owners[term] = key
            for field in ['hint', 'beginner', 'definition', 'plain', 'detail']:
                if not isinstance(entry.get(field), str) or not entry[field].strip():
                    errors.append(f'{name} {key}: missing {field}')
            if 'annotate' in entry and not isinstance(entry['annotate'], bool):
                errors.append(f'{name} {key}: annotate must be bool')
    for entry in additions:
        key = entry['id']
        for field, lo, hi in [('hint', 2, 18), ('beginner', 8, 90), ('definition', 20, 180), ('plain', 8, 90), ('detail', 20, 180)]:
            value = entry.get(field)
            if isinstance(value, str) and not lo <= len(value) <= hi:
                errors.append(f'{key}: {field} length {len(value)}')
        if not isinstance(entry.get('annotate'), bool):
            errors.append(f'{key}: annotate must be bool')
        text = entry.get('beginner', '') + entry.get('definition', '')
        for phrase in ['赋能', '使能', '全方位', '极致', '众所周知']:
            if phrase in text:
                errors.append(f'{key}: forbidden {phrase}')
    # The current library already contains these additions. Compare by ID instead
    # of incorrectly treating the merged entries as a separate legacy baseline.
    current = {x['id']: x for x in merged}
    for entry in additions:
        if entry['id'] not in current:
            errors.append('missing merged entry ' + entry['id'])
        elif current[entry['id']] != entry:
            errors.append('merged entry differs from authored addition ' + entry['id'])
    if baseline is not None:
        for entry in baseline:
            if entry['id'] in expected:
                errors.append('baseline contains addition ' + entry['id'])
            elif current.get(entry['id']) != entry:
                errors.append('baseline entry missing or changed ' + entry['id'])
    annotated = sum(x.get('annotate', True) for x in merged)
    if annotated < 40:
        warnings.append(f'only {annotated} annotated entries')
    return errors, warnings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', type=pathlib.Path, help='Optional legacy-only JSON library to check for preservation')
    args = parser.parse_args()
    read = lambda path: json.loads(path.read_text(encoding='utf-8'))
    merged = read(P / 'content/glossary.json')
    additions = read(P / 'content/rewrite/out/glossary.json')
    sources = read(P / 'content/rewrite/glossary-source.json')
    errors, warnings = validate(merged, additions, sources, read(args.baseline) if args.baseline else None)
    print(f'{len(merged)} library entries, {sum(len(x["terms"]) for x in merged)} aliases, {len(additions)} additions')
    for warning in warnings:
        print('WARN', warning)
    for error in errors:
        print('FAIL', error)
    print(('PASS' if not errors else 'FAILED') + f' glossary: {len(errors)} errors, {len(warnings)} warnings')
    return bool(errors)


if __name__ == '__main__':
    sys.exit(main())
