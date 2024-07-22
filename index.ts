import * as pulumi from "@pulumi/pulumi"
import * as gcp from "@pulumi/gcp"
import * as k8s from "@pulumi/kubernetes"

import * as blake2b from "blake2b"
import * as bs58check from "bs58check"

import deployStatusPage from "./tezos/statusPage"
import deployMetricsPage from "./tezos/metricsPage"
import { TezosChain } from "./tezos/chain"
import { TezosNodes } from "./tezos/nodes"
import { TezosFaucet } from "./tezos/faucet"
import getPublicKeyFromPrivateKey from './tezos/keys'

const cfg = new pulumi.Config()
const faucetPrivateKey = cfg.requireSecret("faucet-private-key")
const faucetRecaptchaSiteKey = cfg.requireSecret("faucet-recaptcha-site-key")
const faucetRecaptchaSecretKey = cfg.requireSecret(
  "faucet-recaptcha-secret-key"
)
const private_teztnets_baking_key = cfg.requireSecret(
  "tf-teztnets-baking-key"
)

const stackname = cfg.require("infra_stack")
const stackRef = new pulumi.StackReference(stackname)

const kubeconfig = stackRef.requireOutput("kubeconfig")

const provider = new k8s.Provider("do-k8s-provider", {
  kubeconfig,
})

const periodicCategory = "Periodic Teztnets"
const protocolCategory = "Protocol Teztnets"
const featureCategory = "Feature Teztnets"
const longCategory = "Long-running Teztnets"

// Create a GCP resource (Storage Bucket) for Bootstrap Smart Contracts
const activationBucket = new gcp.storage.Bucket("testnets-global-activation-bucket", {
  location: "US", // You can choose the appropriate location
  uniformBucketLevelAccess: true,
  storageClass: "STANDARD",
});

// Set the bucket to be publicly readable
new gcp.storage.BucketIAMMember("publicRead", {
  bucket: activationBucket.name,
  role: "roles/storage.objectViewer",
  member: "allUsers",
});


// Define another domain name and a suitable name for the managed zone
const domainNameCom = "teztnets.com";
const managedZoneNameCom = "teztnetscom-zone";

// Create a managed DNS zone
const dnsZoneCom = new gcp.dns.ManagedZone(managedZoneNameCom, {
  name: managedZoneNameCom,
  dnsName: domainNameCom + ".",
  description: "Managed zone for " + domainNameCom,
});


// GitHub Pages IP addresses

// Create A records for each GitHub Pages IP
new gcp.dns.RecordSet("teztnetsComSiteRecord", {
  name: domainNameCom + ".",
  managedZone: dnsZoneCom.name,
  type: "A",
  ttl: 300,
  rrdatas: [
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153",
  ]
});

// chains

// Weeklynet - restarts Wednesdays
//

const weeklynet_chain = new TezosChain(
  {
    category: periodicCategory,
    humanName: "Weeklynet",
    description:
      "A testnet that restarts every Wednesday launched from tezos/tezos master branch. It runs ParisC for 4 cycles then upgrades to proto Alpha.",
    schedule: "0 0 * * WED",
    activationBucket: activationBucket,
    bootstrapContracts: [
      // "exchanger.json",
      // "evm_bridge.json",
    ],
    helmValuesFile: "networks/weeklynet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    // chartPath: "networks/weeklynet/tezos-k8s", // point to a submodule, to run unreleased tezos-k8s code
    chartRepoVersion: "7.1.2", // point to a release of tezos-k8s. This should be the default state.
    bootstrapPeers: [],
  },
  provider
)
new TezosFaucet(
  weeklynet_chain.name,
  {
    humanName: "Weeklynet",
    namespace: weeklynet_chain.namespace,
    helmValuesFile: "networks/weeklynet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "7.1.2",
  },
  provider
)


// Ghostnet is different from the other testnets:
// * launched long time ago, launch code is not in the active code path
// * heavy usage on the RPC endpoint requires a more elaborate setup
//   with archive/rolling nodes, NGINX path filtering and rate limiting.
// Consequently, we made a special class "TezosNodes" for the purpose.
const ghostnetRollingVersion = "octez-v20.1";
const ghostnetArchiveVersion = "octez-v20.1";
const ghostnet_chain = new TezosNodes(
  "ghostnet-nodes",
  {
    chainName: "ghostnet",
    rpcFqdn: `rpc.ghostnet.${domainNameCom}`,
    p2pFqdn: `ghostnet.${domainNameCom}`,
    octezRollingVersion: ghostnetRollingVersion,
    octezArchiveVersion: ghostnetArchiveVersion,
    chartRepoVersion: "7.0.9",
    rollingPvcSize: "50Gi",
    archivePvcSize: "1000Gi"
  },
  provider,
)
new TezosFaucet(
  "ghostnet",
  {
    humanName: "Ghostnet",
    namespace: ghostnet_chain.namespace,
    helmValuesFile: "networks/ghostnet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "7.0.9",
  },
  provider
)

// Albin's broken network(TM)
//
const albinnet_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Albinnet",
    description: "Test Chain",
    activationBucket: activationBucket,
    helmValuesFile: "networks/albinnet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: [],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "7.0.9",
  },
  provider
)

// Beta First Blood Part I
//
const betanet1_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Betanet-2024-07-22",
    description: "Test Chain for the Betanet 2024-07-22 Proposal",
    activationBucket: activationBucket,
    helmValuesFile: "networks/betanet-2024-07-22/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: [],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "7.0.9",
  },
  provider
)
new TezosFaucet(
  betanet1_chain.name,
  {
    namespace: betanet1_chain.namespace,
    humanName: "Betanet-2024-07-22",
    helmValuesFile: "networks/betanet-2024-07-22/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "7.0.9",
  },
  provider
)

// Q
//
/*const qnet_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Qnet",
    description: "Test Chain for the Q Protocol Proposal",
    activationBucket: activationBucket,
    helmValuesFile: "networks/qnet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: ["qnet.tzinit.org"],
    rpcUrls: [],
    indexers: [
      {
        name: "TzKT",
        url: "https://qnet.tzkt.io",
      },
    ],
    chartRepoVersion: "7.0.9",
  },
  provider
)
new TezosFaucet(
  qnet_chain.name,
  {
    namespace: qnet_chain.namespace,
    humanName: "Qnet",
    helmValuesFile: "networks/qnet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "7.0.9",
  },
  provider
)
*/

// ParisC reboot test network
const pariscnet_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "ParisCnet",
    description: "Test Chain for Paris replacement protocol",
    activationBucket: activationBucket,
    helmValuesFile: "networks/pariscnet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: ["pariscnet.tzinit.org"],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "7.1.2",
    networkStakes: true,
  },
  provider
)
new TezosFaucet(
  pariscnet_chain.name,
  {
    namespace: pariscnet_chain.namespace,
    humanName: "Pariscnet",
    helmValuesFile: "networks/pariscnet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "7.1.2",
  },
  provider
)

function getNetworks(chains: TezosChain[]): object {
  const networks: { [name: string]: object } = {}

  chains.forEach(function(chain) {
    const bootstrapPeers: string[] = Object.assign([], chain.params.bootstrapPeers) // clone
    bootstrapPeers.splice(0, 0, `${chain.name}.${domainNameCom}`)

    // genesis_pubkey is the public key associated with the $TEZOS_OXHEAD_BAKING_KEY private key in github secrets
    let genesisPubkey = getPublicKeyFromPrivateKey(chain.params.bakingPrivateKey)
    const network = Object.assign(
      {},
      chain.tezosHelmValues["node_config_network"]
    ) // clone
    network["sandboxed_chain_name"] = "SANDBOXED_TEZOS"
    network["default_bootstrap_peers"] = bootstrapPeers
    network["genesis_parameters"] = {
      values: {
        genesis_pubkey: genesisPubkey,
      },
    }
    if ("activation_account_name" in network) {
      delete network["activation_account_name"]
    }
    if ("genesis" in network && "block" in network["genesis"] === false) {
      // If block hash not passed, use tezos-k8s convention:
      // deterministically derive it from chain name.
      var input = Buffer.from(network["chain_name"])
      var gbk = blake2b(32).update(input).digest("hex")
      var bytes = Buffer.from("0134" + gbk, "hex")
      network["genesis"]["block"] = bs58check.encode(bytes)
    }
    if ("dal_config" in network) {
      network["dal_config"]["bootstrap_peers"] = [
        `dal.${chain.name}.${domainNameCom}:11732`,
      ]
    }

    networks[chain.name] = network
  })

  return networks
}

function getTeztnets(chains: TezosChain[]): object {
  const teztnets: { [name: string]: { [name: string]: Object } } = {}

  chains.forEach(function(chain) {
    let faucetUrl = `https://faucet.${chain.name}.${domainNameCom}`
    teztnets[chain.name] = {
      chain_name: chain.tezosHelmValues["node_config_network"]["chain_name"],
      network_url: `https://${domainNameCom}/${chain.name}`,
      human_name: chain.params.humanName,
      description: chain.params.description,
      docker_build: chain.getDockerBuild(),
      git_ref: chain.getGitRef(),
      last_baking_daemon: chain.getLastBakingDaemon(),
      faucet_url: faucetUrl,
      category: chain.params.category,
      rpc_url: chain.getRpcUrl(),
      rollup_urls: chain.getRollupUrls(),
      evm_proxy_urls: chain.getEvmProxyUrls(),
      rpc_urls: chain.getRpcUrls(),
      masked_from_main_page: false,
      indexers: chain.params.indexers || [],
      network_stakes: chain.params.networkStakes || false
    }
    if (Object.keys(chain.dalNodes).length > 0) {
      teztnets[chain.name].dal_nodes = chain.dalNodes;
    }
  })

  return teztnets
}

// We do not host a ghostnet node here.
// Oxhead Alpha hosts a ghostnet RPC service and baker in the
// sensitive infra cluster.
// Instead, we hardcode the values to be displayed on the webpage.
const ghostnetNetwork = {
  chain_name: "TEZOS_ITHACANET_2022-01-25T15:00:00Z",
  default_bootstrap_peers: [
    `ghostnet.${domainNameCom}`,
    "ghostnet.boot.ecadinfra.com",
    "ghostnet.stakenow.de:9733",
  ],
  genesis: {
    block: "BLockGenesisGenesisGenesisGenesisGenesis1db77eJNeJ9",
    protocol: "Ps9mPmXaRzmzk35gbAYNCAw6UXdE2qoABTHbN2oEEc1qM7CwT9P",
    timestamp: "2022-01-25T15:00:00Z",
  },
  genesis_parameters: {
    values: {
      genesis_pubkey: "edpkuYLienS3Xdt5c1vfRX1ibMxQuvfM67ByhJ9nmRYYKGAAoTq1UC",
    },
  },
  sandboxed_chain_name: "SANDBOXED_TEZOS",
}

export const networks = {
//  ...getNetworks([weeklynet_chain, pariscnet_chain, betanet1_chain]),
  ...getNetworks([weeklynet_chain, pariscnet_chain, betanet1_chain, albinnet_chain]),
//  ...getNetworks([pariscnet_chain]),
  ...{ ghostnet: ghostnetNetwork },
}

// We hardcode the values to be displayed on the webpage.
const lastBakingDaemonMainnetGhostnet = "PsParisC"
const ghostnetTeztnet = {
  category: "Long-running Teztnets",
  chain_name: "TEZOS_ITHACANET_2022-01-25T15:00:00Z",
  description: "Ghostnet is the long-running testnet for Tezos.",
  docker_build: `tezos/tezos:${ghostnetRollingVersion}`,
  faucet_url: `https://faucet.ghostnet.${domainNameCom}`,
  git_ref: ghostnetRollingVersion,
  human_name: "Ghostnet",
  indexers: [
    {
      name: "TzKT",
      url: "https://ghostnet.tzkt.io",
    },
    {
      name: "TzStats",
      url: "https://ghost.tzstats.com",
    },
  ],
  last_baking_daemon: lastBakingDaemonMainnetGhostnet,
  masked_from_main_page: false,
  network_url: `https://${domainNameCom}/ghostnet`,
  rpc_url: `https://rpc.ghostnet.${domainNameCom}`,
  rpc_urls: [
    `https://rpc.ghostnet.${domainNameCom}`,
    "https://ghostnet.ecadinfra.com",
    "https://ghostnet.tezos.marigold.dev",
  ],
}

// We also add mainnet to the teztnets metadata.
// Some systems rely on this to provide lists of third-party RPC services
// to their users. For example, umami wallet.
const mainnetMetadata = {
  category: "Long-running Teztnets",
  chain_name: "TEZOS_MAINNET",
  description: "Tezos Mainnet",
  docker_build: `tezos/tezos:${ghostnetRollingVersion}`,
  git_ref: ghostnetRollingVersion,
  human_name: "Mainnet",
  indexers: [
    {
      name: "TzKT",
      url: "https://tzkt.io",
    },
    {
      name: "TzStats",
      url: "https://tzstats.com",
    },
  ],
  last_baking_daemon: lastBakingDaemonMainnetGhostnet,
  masked_from_main_page: true,
  rpc_url: "https://mainnet.api.tez.ie",
  rpc_urls: [
    "https://mainnet.api.tez.ie",
    "https://mainnet.smartpy.io",
    "https://mainnet.tezos.marigold.dev",
  ],
}

export const teztnets = {
//  ...getTeztnets([weeklynet_chain, pariscnet_chain, betanet1_chain]),
  ...getTeztnets([weeklynet_chain, pariscnet_chain, betanet1_chain, albinnet_chain]),
//  ...getTeztnets([pariscnet_chain]),
  ...{ ghostnet: ghostnetTeztnet, mainnet: mainnetMetadata },
}

deployStatusPage(provider, {
  networks: networks,
  teztnets: teztnets,
  statusPageFqdn: `status.${domainNameCom}`,
  chartRepoVersion: "7.0.9"
});
deployMetricsPage(provider, {
  metricsPageFqdn: `metrics.${domainNameCom}`,
});

// Redirects .xyz to .com

function createDomainRedirectIngress(srcDomain: string, destDomain: string): k8s.networking.v1.Ingress {
  return new k8s.networking.v1.Ingress(`ingress-redirect-${srcDomain}`, {
    metadata: {
      annotations: {
        "kubernetes.io/ingress.class": "nginx",
        "cert-manager.io/cluster-issuer": "letsencrypt-prod",
        "nginx.ingress.kubernetes.io/enable-cors": "true",
        "nginx.ingress.kubernetes.io/cors-allow-origin": "*",
        "nginx.ingress.kubernetes.io/server-snippet": `return 301 $scheme://${destDomain}$request_uri;`
      },
    },
    spec: {
      tls: [{
        hosts: [srcDomain],
        secretName: `${srcDomain}-secret`,
      }],
      rules: [{
        host: srcDomain
      }]
    },
  }, { provider });
}

// Define your domain name and a suitable name for the managed zone
const domainName = "teztnets.xyz";
const managedZoneName = "teztnets-zone";

// Create a managed DNS zone
const dnsZone = new gcp.dns.ManagedZone(managedZoneName, {
  name: managedZoneName,
  dnsName: domainName + ".",
  description: "Managed zone for " + domainName,
});

createDomainRedirectIngress("teztnets.xyz", "teztnets.com");
