

NETWORK=ghostnet
PROTO=PsRiotumaAMotcRoDWW1bysEhQy2n1M5fy8JgRp8jjRfHGmfeA7
KEY=ledger_chris
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.$NETWORK.teztnets.com"

echo "Switching $NETWORK to $PROTO"
echo "CTRL+C now if wrong"
sleep 5


echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
