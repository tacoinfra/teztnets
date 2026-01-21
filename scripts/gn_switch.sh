

NETWORK=ghostnet
PROTO=PtTALLiNtPec7mE7yY4m3k26J8Qukef3E3ehzhfXgFZKGtDdAXu
KEY=ghostnet_dictator
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.$NETWORK.teztnets.com"

echo "Switching $NETWORK to $PROTO"


echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
