import * as gcp from "@pulumi/gcp"
import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"
import * as cronParser from "cron-parser"
import * as fs from "fs"
import * as YAML from "yaml"
import { getChartParams } from './chartResolver'
import { TezosImageResolver } from "./imageResolver"

export interface TezosParameters {
  readonly activationBucket: gcp.storage.Bucket
  readonly bootstrapContracts?: string[]
  readonly category: string
  readonly description: string
  readonly bakingPrivateKey: pulumi.Output<string>
  readonly humanName: string
  readonly snapOver?: string
  readonly indexers?: { name: string; url: string }[]
  readonly chartPath?: string
  readonly chartRepoVersion?: string
  readonly bootstrapPeers?: string[]
  readonly rpcUrls?: string[]
  readonly helmValuesFile: string
  readonly schedule?: string
  readonly networkStakes?: boolean
}

const gcpRegion = "us-central1";
const domainName = 'teztnets.com';

/**
 * Deploy a tezos-k8s topology in a k8s cluster.
 * Supports either local charts or charts from a repo
 */

export class TezosChain extends pulumi.ComponentResource {
  readonly name: string
  readonly snap: string
  readonly params: TezosParameters
  readonly tezosHelmValues: any
  readonly namespace: k8s.core.v1.Namespace
  readonly dalNodes: {
    [name: string]: {
      humanName: string;
      rpc: string;
      p2p: string;
    };
  };

  /**
   * Deploys a private chain on a Kubernetes cluster.
   * @param name The name of the Pulumi resource.
   * @param params Helm chart values and chain bootstrap parameters
   * @param provider The Kubernetes cluster to deploy it into.
   */
  constructor(
    params: TezosParameters,
    provider: k8s.Provider,
    opts?: pulumi.ResourceOptions
  ) {
    const inputs: pulumi.Inputs = {
      options: opts,
    }

    let name: string;
    if (params.schedule) {
      const deployDate = new Date(
        cronParser
          .parseExpression(params.schedule, { utc: true })
          .prev()
          .toLocaleString()
      )
      name =
        `${params.humanName.toLowerCase()}-${deployDate.toISOString().split("T")[0]
        }`
      // Hack - Don't use except in emergencies!
      //name = `${params.humanName.toLowerCase()}-2025-06-11-1`
    } else {
      name = params.humanName.toLowerCase()
    }
    let snap: string;
    if (params.snapOver) {
      snap = params.snapOver
    } else {
      snap = `${params.humanName.toLowerCase()}`
    }

    super("pulumi-contrib:components:TezosChain", name, inputs, opts)

    this.params = params
    this.name = name
    this.snap = snap
    this.dalNodes = {}

    this.tezosHelmValues = YAML.parse(
      fs.readFileSync(this.params.helmValuesFile, "utf8")
    );

    this.tezosHelmValues["accounts"]["teztnetsbaker"]["key"] = this.params.bakingPrivateKey

    if (this.params.schedule) {
      const deployDate = new Date(
        cronParser
          .parseExpression(this.params.schedule, { utc: true })
          .prev()
          .toLocaleString()
      )
      // Hack XXX Hardcode the image
      //this.tezosHelmValues["images"]["octez"] = ""

      const imageResolver = new TezosImageResolver()
      this.tezosHelmValues["images"]["octez"] =
        pulumi
          .output(imageResolver.getLatestTagAsync(deployDate))
          .apply((tag) => `${imageResolver.image}:${tag}`)
      // Hack XXX 
      // This is a trick to change Weeklynet's name when it
      // needs to be respun. if the chain has already launched but 
      // gets bricked because it can no longer upgrade from one proto to the 
      // next, change the date below. It will start with a different chainId.
      // This way, it won't mix with the existing Weeklynet and will be able to sync.
      // Otherwise, the old broken Weeklynet will mix with the new one and you'll never be able to produce
      // another genesis block.
      this.tezosHelmValues["node_config_network"]["chain_name"] =
        `TEZOS-${this.params.humanName.toUpperCase()}-${deployDate.toISOString()}`
      this.tezosHelmValues["node_config_network"]["genesis"]["timestamp"] = deployDate.toISOString();

      // This is the hack to restart Weeklynet with a new chain name
      //
      //this.tezosHelmValues["node_config_network"]["chain_name"] =
      //  `TEZOS-${this.params.humanName.toUpperCase()}-2025-06-11T16:00:00Z`
      //this.tezosHelmValues["node_config_network"]["genesis"]["timestamp"] = "2025-06-11T16:00:00Z";

    }

    if (params.bootstrapContracts) {
      params.bootstrapContracts.forEach((contractFile) => {
        let contractFullName = `${name}-${contractFile}`;

        // Create a new GCP storage object
        new gcp.storage.BucketObject(contractFullName, {
          bucket: params.activationBucket.name,
          name: contractFullName,
          source: new pulumi.asset.FileAsset(`bootstrap_contracts/${contractFile}`),
          contentType: "application/json",
        });

        // Push the URL to the helm values
        if (!this.tezosHelmValues["activation"]["bootstrap_contract_urls"]) {
          this.tezosHelmValues["activation"]["bootstrap_contract_urls"] = [];
        }
        this.tezosHelmValues["activation"]["bootstrap_contract_urls"].push(
          pulumi.interpolate`https://storage.googleapis.com/${params.activationBucket.name}/${contractFullName}`
        );
      });
    }

    this.namespace = new k8s.core.v1.Namespace(
      this.name,
      { metadata: { name: name } },
      { provider: provider }
    )


    // RPC Ingress
    const rpcDomain = `rpc.${name}.${domainName}`

    const rpcIngName = `${rpcDomain}-ingress`
    new k8s.networking.v1.Ingress(
      rpcIngName,
      {
        metadata: {
          namespace: this.namespace.metadata.name,
          name: rpcIngName,
          annotations: {
            "kubernetes.io/ingress.class": "nginx",
            "cert-manager.io/cluster-issuer": "letsencrypt-prod",
            "nginx.ingress.kubernetes.io/enable-cors": "true",
            "nginx.ingress.kubernetes.io/cors-allow-origin": "*",
          },
          labels: { app: "tezos-node" },
        },
        spec: {
          rules: [
            {
              host: rpcDomain,
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "tezos-node-rpc",
                        port: {
                          name: "rpc",
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: [rpcDomain],
              secretName: `${rpcDomain}-secret`,
            },
          ],
        },
      },
      { provider, parent: this }
    )


    // Rollup
    if (
      this.tezosHelmValues.smartRollupNodes &&
      this.tezosHelmValues.smartRollupNodes.length != 0
    ) {
      let rollupFqdn = `evm-rollup-node.${name}.${domainName}`
      let rollupIngressParams = {
        enabled: true,
        host: rollupFqdn,
        labels: {
          app: "rollup-evm",
        },
        annotations: {
          "kubernetes.io/ingress.class": "nginx",
          "cert-manager.io/cluster-issuer": "letsencrypt-prod",
          "nginx.ingress.kubernetes.io/enable-cors": "true",
          "nginx.ingress.kubernetes.io/cors-allow-origin": "*",
        },
        tls: [
          {
            hosts: [rollupFqdn],
            secretName: `${rollupFqdn}-secret`,
          },
        ],
      }
      this.tezosHelmValues.smartRollupNodes.evm.ingress = rollupIngressParams
      let evmProxyFqdn = `evm.${name}.${domainName}`
      let evmProxyIngressParams = {
        enabled: true,
        host: evmProxyFqdn,
        labels: {
          app: "evm-proxy",
        },
        annotations: {
          "kubernetes.io/ingress.class": "nginx",
          "cert-manager.io/cluster-issuer": "letsencrypt-prod",
          "nginx.ingress.kubernetes.io/enable-cors": "true",
          "nginx.ingress.kubernetes.io/cors-allow-origin": "*",
        },
        tls: [
          {
            hosts: [evmProxyFqdn],
            secretName: `${evmProxyFqdn}-secret`,
          },
        ],
      }
      this.tezosHelmValues.smartRollupNodes.evm.evm_proxy.ingress =
        evmProxyIngressParams
    }

    if (this.tezosHelmValues.dalNodes && this.tezosHelmValues.dalNodes.length !== 0) {
      // We define both DAL nodes: the bootstrap node for the network, and the attester.
      // This is different than the L1, where the same node does everything.
      // Gossipsub requires separation from the bootstrap node and the nodes that actually
      // does the duties.
      const dalP2pPort = 11732;

      Object.entries({
        "dal-bootstrap": {
          humanName: 'DAL Bootstrap',
          rpcFqdn: `dal-bootstrap-rpc.${name}.${domainName}`,
          p2pFqdn: `dal.${name}.${domainName}`,
        },
        "dal-dal1": {
          humanName: 'DAL Teztnets Attester',
          rpcFqdn: `dal-attester-rpc.${name}.${domainName}`,
          p2pFqdn: `dal1.${name}.${domainName}`,

        }
      }).forEach(([dalNodeName, { humanName, rpcFqdn, p2pFqdn }]) => {

        const ingressParams = {
          enabled: true,
          host: rpcFqdn,
          labels: { app: `dal-${dalNodeName}` },
          annotations: {
            "kubernetes.io/ingress.class": "nginx",
            "cert-manager.io/cluster-issuer": "letsencrypt-prod",
            "nginx.ingress.kubernetes.io/enable-cors": "true",
            "nginx.ingress.kubernetes.io/cors-allow-origin": "*",
          },
          tls: [{ hosts: [rpcFqdn], secretName: `${rpcFqdn}-secret` }],
        };
        this.tezosHelmValues.dalNodes[dalNodeName].ingress = ingressParams;

        // Setting up GCP static IP address
        const staticIPName = `${name}-${dalNodeName}-ip`;
        const staticIP = new gcp.compute.Address(staticIPName, {
          name: staticIPName,
          region: gcpRegion,
        });

        const serviceName = `${name}-${dalNodeName}`;
        new k8s.core.v1.Service(`${serviceName}-p2p-lb`, {
          metadata: {
            namespace: this.namespace.metadata.name,
            name: serviceName,
            annotations: {
              "external-dns.alpha.kubernetes.io/hostname": p2pFqdn,
              "service.beta.kubernetes.io/gcp-load-balancer-type": "External",
              "networking.gke.io/load-balancer-type": "External",
            },
          },
          spec: {
            ports: [{ port: dalP2pPort, targetPort: dalP2pPort, protocol: "TCP" }],
            selector: { app: `dal-${dalNodeName}` },
            type: "LoadBalancer",
            loadBalancerIP: staticIP.address,
          },
        },
          {
            provider: provider,
          }
        );

        this.tezosHelmValues.dalNodes[dalNodeName].publicAddr = pulumi.interpolate`${staticIP.address}:${dalP2pPort}`;
        this.dalNodes[dalNodeName] = {
          humanName: humanName,
          rpc: `https://${rpcFqdn}`,
          p2p: `${p2pFqdn}:${dalP2pPort}`
        }
      })

      // Set bootstrap peers on the network config (specific to testnets)
      this.tezosHelmValues.node_config_network.dal_config.bootstrap_peers = [
        `dal.${name}.${domainName}:11732`,
        `${name}.bootstrap.dal.nomadic-labs.com`
      ];
    }

    let chartParams = getChartParams(params, "tezos");
    const chartValues: any = {
      ...chartParams,
      namespace: this.namespace.metadata.name,
      values: this.tezosHelmValues,
    }
    new k8s.helm.v3.Chart(
      name,
      chartValues,
      { providers: { kubernetes: provider } }
    )

    new k8s.core.v1.Service(
      `${name}-p2p-lb`,
      {
        metadata: {
          namespace: this.namespace.metadata.name,
          name: name,
          annotations: {
            "external-dns.alpha.kubernetes.io/hostname": `${name}.${domainName}`,
          },
        },
        spec: {
          ports: [
            {
              port: 9732,
              targetPort: 9732,
              protocol: "TCP",
            },
          ],
          selector: { node_class: "tezos-baking-node" },
          type: "LoadBalancer",
        },
      },
      { provider: provider }
    )
  }

  getDockerBuild(): string {
    return this.tezosHelmValues["images"]["octez"]
  }

  getGitRef(): pulumi.Output<string> {
    // guessing git version or release version based on docker naming convention
    // This will fail if octez changes repo tagging convention.
    let dockerBuild = pulumi.output(this.tezosHelmValues["images"]["octez"])
    return dockerBuild.apply((s: string) => {
      let o = s.split(":")[1]
      if (s.includes("master_")) {
        o = o.split("_")[1]
      }
      return o
    })
  }

  getRpcUrl(): string {
    return `https://rpc.${this.name}.${domainName}`
  }
  getRollupUrls(): string[] {
    if (
      this.tezosHelmValues.smartRollupNodes &&
      this.tezosHelmValues.smartRollupNodes.length != 0
    ) {
      return [`https://evm-rollup-node.${this.name}.${domainName}`]
    }
    return []
  }
  getEvmProxyUrls(): string[] {
    if (
      this.tezosHelmValues.smartRollupNodes &&
      this.tezosHelmValues.smartRollupNodes.length != 0
    ) {
      return [`https://evm.${this.name}.${domainName}`]
    }
    return []
  }
  getRpcUrls(): Array<string> {
    return [...[this.getRpcUrl()], ...this.params.rpcUrls || []]
  }
}
