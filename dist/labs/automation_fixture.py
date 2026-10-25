#!/usr/bin/env python3
"""Offline automation exercise, Python >=3.9 standard library. Never opens a socket."""
import argparse
import ipaddress
import json


def validate(inventory):
    if not isinstance(inventory, list) or not inventory:
        raise ValueError('inventory must be a nonempty list')
    names, addresses = set(), set()
    for item in inventory:
        name = item['name']
        address = str(ipaddress.ip_address(item['address']))
        if not isinstance(name, str) or not name.strip() or name in names or address in addresses:
            raise ValueError('empty or duplicate name/address')
        names.add(name)
        addresses.add(address)
    return inventory


def reconcile(state, desired, failure='none'):
    log = []
    if failure == 'timeout':
        return ['CONNECT_TIMEOUT changed=false'], False
    log.append('CONNECTED demo-r1')
    before = state['description']
    log.append('READ description=' + before)
    if before == desired:
        return log + ['NO_CHANGE changed=false', 'VERIFY PASS'], True
    state['description'] = desired
    log.append('CHANGED description=' + desired)
    if failure in ('drift', 'rollback-fail'):
        state['description'] = 'DRIFT'
    actual = state['description']
    if actual != desired:
        log.append('VERIFY_FAIL actual=' + actual)
        if failure == 'rollback-fail':
            log.append('ROLLBACK_FAIL manual_recovery_required=true')
            return log, False
        state['description'] = before
        assert state['description'] == before
        return log + ['ROLLBACK verified=' + before], False
    assert actual == desired
    return log + ['VERIFY PASS'], True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--failure', choices=['none', 'timeout', 'drift', 'rollback-fail'], default='none')
    parser.add_argument('--inventory', help='optional JSON inventory file')
    args = parser.parse_args()
    inventory = [{'name': 'demo-r1', 'address': '192.0.2.11'}]
    if args.inventory:
        with open(args.inventory, encoding='utf-8') as handle:
            inventory = json.load(handle)
    validate(inventory)
    # This exercise deliberately supports exactly the single fixture device.
    if inventory != [{'name': 'demo-r1', 'address': '192.0.2.11'}]:
        raise ValueError('fixture supports only demo-r1=192.0.2.11; no real driver is installed')
    state = {'description': 'OLD'}
    output, success = reconcile(state, 'LAB-UPLINK', args.failure)
    print('\n'.join(output))
    if success:
        print('SECOND RUN')
        print('\n'.join(reconcile(state, 'LAB-UPLINK')[0]))
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
