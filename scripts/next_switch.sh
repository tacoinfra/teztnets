

#PROTO=PtSEouLov7Fp6XoqXUBqd7XzggUpUarSMcSUsR5MarqspqiuQBY
PROTO=PtSeouLouXkxhg39oWzjxDWaCydNfR3RxCUrNe4Q9Ro8BTehcbh
KEY=qdictator
FAUCET=oxford_rich_fund 
ENDPOINT="https://rpc.nextnet-20250626.teztnets.com"

echo "Switching to $PROTO"
echo "CTRL+C now if wrong"
sleep 5

~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 2 from ${FAUCET} to $KEY --burn-cap 0.06425
sleep 5
~/tezos/tezos/octez-client -E ${ENDPOINT} transfer 1 from ${KEY} to $FAUCET --burn-cap 0.06425
sleep 5


echo "octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force"
#octez-client -E ${ENDPOINT} submit proposals for $KEY $PROTO --force
