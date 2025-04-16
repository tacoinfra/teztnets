
# TUNA 50,000,000,000,000,000 means 50,000,000,000
# Multiple all numbers by a million!

while(<>) {
	chomp;
	my @a = split ",";

	my $tzbaker=0;
	$tzbaker++ if ($a[1] eq 'teztnetsbaker');

	if ($a[5]>0) {

		$a[5] = $a[5] * 1000000;
		print "  $a[1]:\n";
		print "    # $a[2]\n";
		print "    key: $a[3]\n" unless $tzbaker;
		print "    bootstrap_balance: \"$a[5]\"\n";
		print "    is_bootstrap_baker_account: ".lc($a[4])."\n";
    		print "    type: secret\n" if $tzbaker;
		print "    dal_node_rpc_url: http://dal-dal1:10732\n" if ($tzbaker);
		print "\n";

	}

}
