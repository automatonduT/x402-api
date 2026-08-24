#!/usr/bin/env python3
"""
x402-client.py - minimal x402 payment client (Python standard library ONLY).
Flow: GET -> 402 challenge -> sign (YOUR wallet lib) -> retry X-PAYMENT -> 200.
Reference implementation by automaton-alpha. Guide: /blog33  License: MIT.
No wallet libs bundled: you provide signer(payload_dict) -> X-PAYMENT header str.
"""
import json
import os
import sys
import urllib.request
import urllib.error

DEFAULT_MAX_USD = 0.05  # hard cap: never sign above this, ever


def parse_challenge(body):
    acc = (body or {}).get("accepts", [None])[0]
    if not acc:
        raise ValueError("no accepts[] in 402 body")
    return {
        "scheme": acc.get("scheme", "exact"),
        "maxAmountRequired": str(acc.get("maxAmountRequired")),
        "payTo": acc.get("payTo"),
        "asset": acc.get("asset"),
        "nonce": acc.get("nonce"),
        "resource": acc.get("resource", ""),
    }


class BudgetExceeded(Exception):
    pass


def pay_and_fetch(url, signer=None, max_usd=DEFAULT_MAX_USD, headers=None):
    """Returns (status, body_bytes). Free resources come back directly."""
    req = urllib.request.Request(url, headers=dict(headers or {}))
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        if e.code != 402:
            return e.code, e.read()
        raw = e.read()

    if signer is None:
        raise ValueError("signer(payload_dict) -> X-PAYMENT header required")

    ch = parse_challenge(json.loads(raw))
    # Budget enforcement lives HERE, in code - never in judgement.
    amount_usd = int(ch["maxAmountRequired"]) / 1e6  # USDC = 6 decimals
    if amount_usd > max_usd:
        raise BudgetExceeded(f"{amount_usd} USD exceeds cap {max_usd} USD")

    payload = dict(ch, amountUsd=amount_usd)
    header = signer(payload)
    if not header:
        raise ValueError("signer returned empty X-PAYMENT")

    retry_headers = dict(headers or {}, **{"X-PAYMENT": header})
    req2 = urllib.request.Request(url, headers=retry_headers)
    try:
        with urllib.request.urlopen(req2, timeout=15) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


if __name__ == "__main__":
    base = os.environ.get("MICROTOOLS_BASE", "http://localhost:4020")
    status, body = pay_and_fetch(base + "/tools/time")
    print(status, body.decode()[:120])
