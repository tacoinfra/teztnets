#!/usr/bin/env python3
"""Compare testnet protocol constants against mainnet and flag unexpected diffs.

For each network directory under networks/ that has an expected_diffs.yaml,
fetches live constants from the testnet and mainnet RPCs, diffs them,
and checks that every diff is documented in expected_diffs.yaml.

Exit codes:
  0 - all diffs are expected
  1 - unexpected diffs found or errors occurred

Usage:
  python3 scripts/check_testnet_params.py [--mainnet-rpc URL]
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
import yaml

MAINNET_RPC = "https://rpc.tzbeta.net"
NETWORKS_DIR = "networks"
CONSTANTS_PATH = "/chains/main/blocks/head/context/constants"


def fetch_constants(rpc_url: str) -> dict[str, object]:
    url = f"{rpc_url}{CONSTANTS_PATH}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except (urllib.error.URLError, TimeoutError) as e:
        print(f"  WARNING: could not fetch {url}: {e}", file=sys.stderr)
        return {}


def flatten(d: dict[str, object], prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        elif isinstance(v, list):
            out[key] = json.dumps(v, sort_keys=True)
        else:
            out[key] = str(v)
    return out


def load_expected_diffs(network_dir: str) -> dict[str, str] | None:
    path = os.path.join(network_dir, "expected_diffs.yaml")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        data = yaml.safe_load(f)
    return data if isinstance(data, dict) else {}


def get_rpc_url(network_name: str) -> str:
    return f"https://rpc.{network_name}.teztnets.com"


def check_network(
    network_name: str,
    network_dir: str,
    mainnet_constants: dict[str, str],
) -> list[str]:
    """Returns list of error messages for unexpected diffs."""
    expected = load_expected_diffs(network_dir)
    if expected is None:
        return []  # no expected_diffs.yaml means network opts out of checking

    rpc_url = get_rpc_url(network_name)
    print(f"Checking {network_name} ({rpc_url})...")

    raw_constants = fetch_constants(rpc_url)
    if not raw_constants:
        print(f"  WARNING: could not fetch constants, skipping")
        return []

    testnet_constants = flatten(raw_constants)
    errors: list[str] = []

    # Find all diffs
    all_keys = sorted(set(list(mainnet_constants.keys()) + list(testnet_constants.keys())))
    actual_diffs: dict[str, tuple[str, str]] = {}
    for k in all_keys:
        mv = mainnet_constants.get(k)
        tv = testnet_constants.get(k)
        if mv != tv:
            actual_diffs[k] = (
                tv if tv is not None else "<missing>",
                mv if mv is not None else "<missing>",
            )

    # Check for unexpected diffs
    unexpected: list[tuple[str, str, str]] = []
    for k, (tv, mv) in actual_diffs.items():
        if k not in expected:
            unexpected.append((k, tv, mv))

    if unexpected:
        errors.append(f"{network_name}: {len(unexpected)} unexpected diff(s) from mainnet:")
        for k, tv, mv in unexpected:
            errors.append(f"  {k}: {tv} (mainnet: {mv})")
        errors.append(f"  Add these to {network_dir}/expected_diffs.yaml if intentional.")

    # Check for stale entries in expected_diffs (documented but no longer different)
    stale = [k for k in expected if k not in actual_diffs]
    if stale:
        errors.append(f"{network_name}: {len(stale)} stale entry/entries in expected_diffs.yaml (no longer different from mainnet):")
        for k in stale:
            errors.append(f"  {k}")

    if not errors:
        print(f"  OK: {len(actual_diffs)} diff(s), all expected")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Check testnet params against mainnet")
    parser.add_argument("--mainnet-rpc", default=MAINNET_RPC, help="Mainnet RPC URL")
    args = parser.parse_args()

    print(f"Fetching mainnet constants from {args.mainnet_rpc}...")
    raw_mainnet = fetch_constants(args.mainnet_rpc)
    if not raw_mainnet:
        print("ERROR: could not fetch mainnet constants", file=sys.stderr)
        return 1
    mainnet_constants = flatten(raw_mainnet)
    print(f"  Got {len(mainnet_constants)} constants")

    all_errors: list[str] = []

    for entry in sorted(os.listdir(NETWORKS_DIR)):
        network_dir = os.path.join(NETWORKS_DIR, entry)
        if not os.path.isdir(network_dir):
            continue
        errors = check_network(entry, network_dir, mainnet_constants)
        all_errors.extend(errors)

    if all_errors:
        print()
        print("ERRORS:")
        for e in all_errors:
            print(f"  {e}")
        return 1

    print()
    print("All testnet parameters are as expected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
