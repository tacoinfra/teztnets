import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"

export interface TezosNodesParameters {
  readonly chainName: string;
  readonly rpcFqdn: string;
  readonly p2pFqdn: string;
  readonly rollingPvcSize: string;
  readonly archivePvcSize: string;
  readonly chartRepoVersion?: string;
  readonly chartPath?: string;
  readonly octezVersion: string;
}

export class TezosNodes extends pulumi.ComponentResource {
  readonly params: TezosNodesParameters
  readonly provider: k8s.Provider

  constructor(
    name: string,
    params: TezosNodesParameters,
    provider: k8s.Provider,
    opts?: pulumi.ResourceOptions
  ) {
    const inputs: pulumi.Inputs = {
      options: opts,
    }

    /**
     * Deploys Tezos Nodes on a K8s cluster, for RPC and boot node functionality.
     * @param name The name of the Pulumi resource.
     * @param params Helm chart values and chain bootstrap parameters
     * @param provider The Kubernetes cluster to deploy it into.
     */
    super("pulumi-contrib:components:TezosChain", name, inputs, opts)

    this.params = params
    this.provider = provider


    const nodesNSName = `${name}-nodes`;
    const ns = new k8s.core.v1.Namespace(
      name,
      { metadata: { name: name } },
      {
        provider: this.provider,
        parent: this
      }

    )

    let chartParams
    if (params.chartPath) {
      chartParams = { path: `${params.chartPath}/charts/tezos-faucet` }
    } else {
      chartParams = {
        fetchOpts: {
          repo: "https://oxheadalpha.github.io/tezos-helm-charts"
        },
        chart: "tezos-chain",
      }
    }
    let helmValues = {
      images: {
        octez: `tezos/tezos:${params.octezVersion}`,
      },
      node_config_network: {
        chain_name: params.chainName,
      },
      prefer_tarballs: true,
      nodes: {
        'rolling-node': {
          storage_size: params.rollingPvcSize,
          instances: [{
            config: {
              shell: {
                history_mode: "rolling"
              }
            }
          }],
        },
        // 'archive-node': {
        //   storage_size: params.archivePvcSize,
        //   instances: [{
        //     config: {
        //       shell: {
        //         history_mode: "archive"
        //       }
        //     }
        //   }],
        // }
      },
    };
    const chartValues: any = {
      ...chartParams,
      namespace: ns.metadata.name,
      values: helmValues,
      version: params.chartRepoVersion,
    }
    new k8s.helm.v3.Chart(name, chartValues, {
      providers: { kubernetes: this.provider },
      parent: this
    });
    new k8s.networking.v1.Ingress(
      `${name}-ingress`,
      {
        metadata: {
          namespace: ns.metadata.name,
          name: `${name}-ingress`,
          annotations: {
            'kubernetes.io/ingress.class': "nginx",
            'cert-manager.io/cluster-issuer': "letsencrypt-prod",
            'nginx.ingress.kubernetes.io/enable-cors': 'true',
            'nginx.ingress.kubernetes.io/cors-allow-origin': '*',

            // Rate Limit
            'nginx.ingress.kubernetes.io/limit-rps': "250",
            'nginx.ingress.kubernetes.io/limit-connections': "250",
            'nginx.ingress.kubernetes.io/limit-req-status-code': "429",
            // End Rate Limit

            // Redirect to Archive and blacklisted endpoints
            // When we get a 404 from the rolling node, we redirect to the archive node.
            // This is a slight hack of the "custom-http-errors" feature.
            // Normally, it would be used to show a fancy 404 page.
            // We also set a variable $archivenode to force DNS resolution, see
            // https://serverfault.com/questions/240476/how-to-force-nginx-to-resolve-dns-of-a-dynamic-hostname-everytime-when-doing-p
            // And when using proxy, we have to add CORS headers manually since ingress-nginx "enable-cors" does not apply to proxy.
            'nginx.ingress.kubernetes.io/custom-http-errors': "404",
            'nginx.ingress.kubernetes.io/configuration-snippet': "error_page 404 = @archivenode;",
            'nginx.ingress.kubernetes.io/server-snippet': `location @archivenode {
  set $archivenode http://archive-node.${nodesNSName}.svc.cluster.local:8732;
  more_set_headers 'Access-Control-Allow-Origin: *';
  more_set_headers 'Access-Control-Allow_Credentials: true';
  more_set_headers 'Access-Control-Allow-Headers: Authorization,Accept,Origin,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
  more_set_headers 'Access-Control-Allow-Methods: GET,POST,OPTIONS,PUT,DELETE,PATCH';
  proxy_pass $archivenode;
}
# Deny injection of blocks and protocols (no baking)
location ~ ^/injection/(block|protocol) {
  deny all;
  return 403;
}
# Deny access to internal node config
location ~ ^/(network|worker|stats|config) {
  deny all;
  return 403;
}
# Query all contracts can hang the node
location ~ ^/chains/main/blocks/([a-zA-Z0-9]+)/context/contracts$ {
  deny all;
  return 403;
}
# Query all endorsing rights can hang the node
location ~ ^/chains/main/blocks/([a-zA-Z0-9]+)/helpers/(baking|endorsing)_rights$ {
  deny all;
  return 403;
}
# Bots sometimes query the mempool for frontrunning
location ~ ^/chains/([a-zA-Z]+)/mempool {
  deny all;
  return 403;
}
# Any queries about level go to archive node.
# These queries state the mode of the node (archive or rolling)
# and give the highest/lowest levels that we have.
location ~ ^/chains/([a-zA-Z]+)/(checkpoint|levels) {
  set $archivenode http://archive-node.${nodesNSName}.svc.cluster.local:8732;
  more_set_headers 'Access-Control-Allow-Origin: *';
  more_set_headers 'Access-Control-Allow_Credentials: true';
  more_set_headers 'Access-Control-Allow-Headers: Authorization,Accept,Origin,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range';
  more_set_headers 'Access-Control-Allow-Methods: GET,POST,OPTIONS,PUT,DELETE,PATCH';
  proxy_pass $archivenode;
}
`,
            // End Redirect to Archive and blacklisted endpoints
          }
        },
        spec: {
          rules: [
            {
              host: params.rpcFqdn,
              http: {
                paths: [{
                  pathType: "Prefix",
                  path: "/",
                  backend: {
                    service: {
                      name: "tezos-node-rpc",
                      port: { number: 8732 },
                    },
                  },
                }],
              },
            }
          ],
          tls: [
            {
              hosts: [params.rpcFqdn],
              secretName: `${name}-tls-secret`
            }
          ],
        },
      },
      {
        provider: provider,
        parent: this
      }
    )
  }
}
