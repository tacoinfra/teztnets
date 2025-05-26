
NETWORK=dqnet-202410
PROTO=PsQuebecnLByd3JwTiGadoG4nGWi3HYiLXUjkibeFV8dCFeVMUg
KEY=qdictator
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.$NETWORK.teztnets.com"

# The dictator key needs funds
#
echo "===> Funding the dictator"
octez-client -E ${ENDPOINT} transfer 2 from ${FAUCET} to $KEY --burn-cap 0.06425
sleep 20
octez-client -E ${ENDPOINT} transfer 1 from ${KEY} to $FAUCET --burn-cap 0.06425
sleep 20

echo "===> Switching $NETWORK to $PROTO"
octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force

