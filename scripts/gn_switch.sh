

NETWORK=ghostnet
PROTO=PtSeouLouXkxhg39oWzjxDWaCydNfR3RxCUrNe4Q9Ro8BTehcbh
KEY=ghostnet_dictator
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.$NETWORK.teztnets.com"

echo "Switching $NETWORK to $PROTO"


echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
