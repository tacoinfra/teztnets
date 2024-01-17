#!/bin/sh

for i in networks teztnets; do
	pulumi stack output $i > $i.json
done

python3 teztnets_xyz_page/release.py
cd target/release

bundle install
bundle exec jekyll serve

