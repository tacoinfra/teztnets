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

const periodicCategory = "Periodic/Internal Teztnets"
const protocolCategory = "Protocol Teztnets"
const featureCategory = "Feature Teztnets"
const otherCategory = "Other Teztnets"
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

// Weeklynet - restarts Wednesdays
const weeklynet_chain = new TezosChain(
  {
    category: periodicCategory,
    humanName: "Weeklynet",
    description:
      "A testnet that restarts every Wednesday launched from tezos/tezos master branch. It runs Next for 4 cycles then upgrades to proto Alpha.",
    schedule: "0 0 * * WED",
    activationBucket: activationBucket,
    bootstrapContracts: [
      // "exchanger.json",
      // "evm_bridge.json",
    ],
    helmValuesFile: "networks/weeklynet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    // chartPath: "networks/weeklynet/tezos-k8s", // point to a submodule, to run unreleased tezos-k8s code
    chartRepoVersion: "8.0.2", // point to a release of tezos-k8s. This should be the default state.
    bootstrapPeers: ["weeklynet.tzinit.org"],
    //    alias: "weeklynet",
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
    chartRepoVersion: "8.0.2",
  },
  provider
)

// Ghostnet is different from the other testnets:
// * launched long time ago, launch code is not in the active code path
// * heavy usage on the RPC endpoint requires a more elaborate setup
//   with archive/rolling nodes, NGINX path filtering and rate limiting.
// Consequently, we made a special class "TezosNodes" for the purpose.
const ghostnetRollingVersion = "octez-v23.2"
const ghostnetArchiveVersion = "octez-v23.2";
const ghostnet_chain = new TezosNodes(
  "ghostnet-nodes",
  {
    chainName: "ghostnet",
    rpcFqdn: `rpc.ghostnet.${domainNameCom}`,
    p2pFqdn: `ghostnet.${domainNameCom}`,
    octezRollingVersion: ghostnetRollingVersion,
    octezArchiveVersion: ghostnetArchiveVersion,
    chartRepoVersion: "8.0.2",
    rollingPvcSize: "50Gi",
    archivePvcSize: "3000Gi"
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
    chartRepoVersion: "8.0.2",
  },
  provider
)

// Nextnet test network - use pre-protocol proposal
/*
const nextnet2_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Nextnet-20251015",
    description: "Test Chain for Next protocol",
    activationBucket: activationBucket,
    helmValuesFile: "networks/nextnet-20251015/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: [ "nextnet.tzinit.org" ],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "8.0.2",
    networkStakes: true,
  },
  provider
)

new TezosFaucet(
  nextnet2_chain.name,
  {
    namespace: nextnet2_chain.namespace,
    humanName: "Nextnet-20251015",
    helmValuesFile: "networks/nextnet-20251015/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "8.0.2",
  },
  provider
)
*/

// Nextnet test network - use pre-protocol proposal
//
const nextnet4_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Nextnet-20251022",
    description: "Test Chain for Next protocol",
    activationBucket: activationBucket,
    helmValuesFile: "networks/nextnet-20251022/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: ["nextnet.tzinit.org"],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "8.0.2",
    networkStakes: true,
    alias: "nextnet", // Add alias for Nextnet
    snapOver: "nextnet", // Add alias for Nextnet
  },
  provider
)

new TezosFaucet(
  nextnet4_chain.name,
  {
    namespace: nextnet4_chain.namespace,
    humanName: "Nextnet-20251022",
    helmValuesFile: "networks/nextnet-20251022/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "8.0.2",
    alias: "nextnet", // Add alias for Nextnet
  },
  provider
)

// END of Nextnet

// Tallinnnet test network 
//
const tallinnnet_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Tallinnnet",
    description: "Test Chain for Tallinn protocol",
    activationBucket: activationBucket,
    helmValuesFile: "networks/tallinnnet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: ["tallinnnet.tzinit.org"],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "8.0.3",
    networkStakes: true,
    alias: "proposednet", // Add alias
  },
  provider
)

new TezosFaucet(
  tallinnnet_chain.name,
  {
    namespace: tallinnnet_chain.namespace,
    humanName: "Tallinnnet",
    helmValuesFile: "networks/tallinnnet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "8.0.2",
    alias: "proposednet", // Add alias
  },
  provider
)

// END of Tallinnnet

// Seoul test network

const seoulnet_chain = new TezosChain(
  {
    category: protocolCategory,
    humanName: "Seoulnet",
    description: "Test Chain for Seoul protocol",
    activationBucket: activationBucket,
    helmValuesFile: "networks/seoulnet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: ["seoulnet.tzinit.org"],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "8.0.2",
    networkStakes: true,
    alias: "currentnet", // Add alias for Seoulnet
  },
  provider
)

new TezosFaucet(
  seoulnet_chain.name,
  {
    namespace: seoulnet_chain.namespace,
    humanName: "Seoulnet",
    helmValuesFile: "networks/seoulnet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "8.0.2",
    alias: "currentnet", // Add alias for Seoulnet faucet
  },
  provider
)

// END of Seoulnet

// Shadownet testing
//
const shadownet_chain = new TezosChain(
  {
    category: longCategory,
    humanName: "Shadownet",
    description: "Shadownet - long term testnet",
    activationBucket: activationBucket,
    helmValuesFile: "networks/shadownet/values.yaml",
    bakingPrivateKey: private_teztnets_baking_key,
    bootstrapPeers: ["shadownet.tzinit.org"],
    rpcUrls: [],
    indexers: [],
    chartRepoVersion: "8.0.2",
    networkStakes: true,
  },
  provider
)

new TezosFaucet(
  shadownet_chain.name,
  {
    namespace: shadownet_chain.namespace,
    humanName: "Shadownet",
    helmValuesFile: "networks/shadownet/faucet_values.yaml",
    faucetPrivateKey: faucetPrivateKey,
    faucetRecaptchaSiteKey: faucetRecaptchaSiteKey,
    faucetRecaptchaSecretKey: faucetRecaptchaSecretKey,
    chartRepoVersion: "8.0.2",
  },
  provider
)

// End of Shadownet

function getNetworks(chains: TezosChain[]): object {
  const networks: { [name: string]: object } = {}

  chains.forEach(function (chain) {
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
        `${chain.name}.bootstrap.dal.nomadic-labs.com:11732`,
      ]
    }

    networks[chain.name] = network
  })

  return networks
}

// Define the network info interface
interface NetworkInfo {
  chain_name: any;
  network_url: string;
  human_name: string;
  description: string;
  docker_build: string;
  git_ref: any;
  faucet_url: string;
  snapshot_url: string;
  category: string;
  rpc_url: string;
  rollup_urls: any;
  evm_proxy_urls: any;
  rpc_urls: any;
  masked_from_main_page: boolean;
  indexers: any[];
  network_stakes: boolean;
  aliasOf?: string;
  dal_nodes?: any;
}

function getTeztnets(chains: TezosChain[]): object {
  const teztnets: { [name: string]: NetworkInfo } = {}

  chains.forEach(function (chain) {
    let faucetUrl = `https://faucet.${chain.name}.${domainNameCom}`

    // Create the base network information
    const networkInfo: NetworkInfo = {
      chain_name: chain.tezosHelmValues["node_config_network"]["chain_name"],
      network_url: `https://${domainNameCom}/${chain.name}`,
      human_name: chain.params.humanName,
      description: chain.params.description,
      docker_build: chain.getDockerBuild(),
      git_ref: chain.getGitRef(),
      faucet_url: faucetUrl,
      snapshot_url: `https://snapshots.tzinit.org/${chain.snap}/rolling`,
      category: chain.params.category,
      rpc_url: chain.getRpcUrl(),
      rollup_urls: chain.getRollupUrls(),
      evm_proxy_urls: chain.getEvmProxyUrls(),
      rpc_urls: chain.getRpcUrls(),
      masked_from_main_page: false,
      indexers: chain.params.indexers || [],
      network_stakes: chain.params.networkStakes || false
    }

    // Add DAL nodes if present
    if (Object.keys(chain.dalNodes).length > 0) {
      (networkInfo as any)['dal_nodes'] = chain.dalNodes;
    }

    // Add the network to teztnets
    teztnets[chain.name] = networkInfo

    // If an alias is defined, create an alias entry that points to the same network
    if (chain.params.alias) {
      // Create a copy of the network info for the alias
      const aliasNetworkInfo: NetworkInfo = { ...networkInfo }

      // Update URLs to use the alias domain
      aliasNetworkInfo.faucet_url = `https://faucet.${chain.params.alias}.${domainNameCom}`
      aliasNetworkInfo.rpc_url = `https://rpc.${chain.params.alias}.${domainNameCom}`

      // Mark as an alias
      aliasNetworkInfo.aliasOf = chain.name

      // Add the network alias to teztnets
      teztnets[chain.params.alias] = aliasNetworkInfo
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
  ...getNetworks([weeklynet_chain]),
  ...getNetworks([seoulnet_chain]),
  ...getNetworks([shadownet_chain]),
  ...getNetworks([nextnet4_chain]),
  ...getNetworks([tallinnnet_chain]),
  ...{ ghostnet: ghostnetNetwork },
}

const ghostnetTeztnet = {
  category: "Long-running Teztnets",
  chain_name: "TEZOS_ITHACANET_2022-01-25T15:00:00Z",
  description: "Ghostnet is the long-running testnet for Tezos.",
  docker_build: `tezos/tezos:${ghostnetRollingVersion}`,
  faucet_url: `https://faucet.ghostnet.${domainNameCom}`,
  snapshot_url: `https://snapshots.tzinit.org/ghostnet/rolling`,
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
  masked_from_main_page: false,
  network_url: `https://${domainNameCom}/ghostnet`,
  rpc_url: `https://rpc.ghostnet.${domainNameCom}`,
  rpc_urls: [
    `https://rpc.ghostnet.${domainNameCom}`,
    "https://ghostnet.ecadinfra.com",
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
  masked_from_main_page: true,
  rpc_url: "https://mainnet.api.tez.ie",
  rpc_urls: [
    "https://mainnet.api.tez.ie",
  ],
}

export const teztnets = {
  ...getTeztnets([weeklynet_chain]),
  ...getTeztnets([shadownet_chain]),
  ...getTeztnets([seoulnet_chain]),
  ...getTeztnets([nextnet4_chain]),
  ...getTeztnets([tallinnnet_chain]),
  //  ...getTeztnets([shadownet_chain]),
  //  ...getTeztnets([seoulnet_chain]),
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
