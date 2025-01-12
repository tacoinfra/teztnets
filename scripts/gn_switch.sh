

NETWORK=ghostnet
PROTO=PsQuebecnLByd3JwTiGadoG4nGWi3HYiLXUjkibeFV8dCFeVMUg
KEY=dictator_keys
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.$NETWORK.teztnets.com"

echo "Switching $NETWORK to $PROTO"
echo "CTRL+C now if wrong"
sleep 5


echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
