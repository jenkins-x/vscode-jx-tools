export interface KubeConfig {
    namespace: string;
    kubeFile: string;
}

const config: KubeConfig = {
    namespace: '/apis/jenkins.io/v1/namespaces/jx/',
    kubeFile: process.env['HOME'] + '/.kube/config'
};

export default config;