#!/bin/python
import json
import os
import shutil
import jinja2

shutil.copytree("teztnets_xyz_page/website", "target/release", dirs_exist_ok=True)

teztnets = {}
with open("./teztnets.json", "r") as teztnets_file:
    teztnets = json.load(teztnets_file)

networks = {}
with open("./networks.json", "r") as networks_file:
    networks = json.load(networks_file)

for network_name in networks:
    with open(f"target/release/{network_name}", "w") as out_file:
        print(json.dumps(networks[network_name], indent=2), file=out_file)

# group by category for human rendering
# Order manually. Start with long-running.
category_desc = {
    "Long-running Teztnets": "These networks are long-running test networks that are similar to mainnet. They run the same protocol as mainnet but switch over to the next protocol earlier than mainnet for testing. If you are developing applications, you probably want to develop on these networks.",
    "Protocol Teztnets": "These test networks are deployed specifically to test individual Tezos protocols. There is usually one for the currently deployed protocol and one for the next protocol. If you are developing your application for the next protocol, you will want to use that test network.",
    "Periodic/Internal Teztnets": "These test networks restart regularly and track the development of the master branch of [Octez repo](https://gitlab.com/tezos/tezos/).\n \n☠️ You probably don't want to use these unless you are a core protocol developer.",
}
#    "Feature Teztnets": "Testnets deployed specifically to test specific Tezos features.",

nested_teztnets = {
    "Long-running Teztnets": {},
    "Protocol Teztnets": {},
    #    "Feature Teztnets": {},
    "Periodic/Internal Teztnets": {},
}

for k, v in teztnets.items():
    # Skip networks that are masked or marked as aliases
    if v["masked_from_main_page"] or v.get("aliasOf"):
        continue
    if v["category"] not in nested_teztnets:
        nested_teztnets[v["category"]] = {}
    nested_teztnets[v["category"]][k] = v
    nested_teztnets[v["category"]][k]["activated_on"] = networks[k]["genesis"][
        "timestamp"
    ].split("T")[0]

index = jinja2.Template(open("teztnets_xyz_page/index.md.jinja2").read()).render(
    teztnets=nested_teztnets, category_desc=category_desc
)

with open("target/release/index.markdown", "a") as out_file:
    print(index, file=out_file)
with open("target/release/teztnets.json", "w") as out_file:
    print(json.dumps(teztnets, indent=2), file=out_file)

for k, v in teztnets.items():
    # Skip mainnet
    if k == "mainnet":
        continue

    # Handle aliases: If this is an alias, we'll use the original network's information
    original_k = k
    original_v = v
    if "aliasOf" in v:
        # This is an alias, get the original network's information
        original_k = v["aliasOf"]
        original_v = teztnets[original_k]

        # But keep the alias's URLs
        original_v = dict(original_v)  # Create a copy to avoid modifying the original
        original_v["rpc_url"] = v["rpc_url"]
        original_v["faucet_url"] = v["faucet_url"]

        # Add note about being an alias
        original_v["alias_note"] = (
            f"{v['human_name']} is an alias for {original_v['human_name']}."
        )

    v["release"] = None
    if "tezos/tezos:v" in original_v["docker_build"]:
        v["release"] = original_v["docker_build"].split("tezos/tezos:")[1]
    v["docker_build_hyperlinked"] = original_v["docker_build"]

    if original_v["docker_build"].startswith("tezos/tezos"):
        # build from docker hub, providing a link
        v["docker_build_hyperlinked"] = (
            "["
            + original_v["docker_build"]
            + "](https://hub.docker.com/r/tezos/tezos/tags?page=1&ordering=last_updated&name="
            + original_v["docker_build"].replace("tezos/tezos:", "")
            + ")"
        )

    v["git_repo"] = "git@gitlab.com:tezos/tezos.git"

    readme = ""

    # Use the original network's README for aliases
    readme_path = f"networks/{original_k.split('-')[0]}/README.md"
    if os.path.exists(readme_path):
        with open(readme_path) as readme_file:
            readme = readme_file.read()

    teztnet_md = jinja2.Template(
        open("teztnets_xyz_page/teztnet_page.md.jinja2").read()
    ).render(
        k=k,
        v=v,
        original_k=original_k,
        network_params=networks[original_k],
        readme=readme,
    )

    with open(
        f"target/release/{v['human_name'].lower()}-about.markdown", "w"
    ) as out_file:
        print(teztnet_md, file=out_file)
