import * as path from 'path';

export interface Config {
    imagesPath: string;
    kube: {
        namespace: string;
        kubeFile: string;
    };
}

export enum Theme {
    LIGHT = 'light',
    DARK = 'dark'
}

export const config: Config = {
    imagesPath: path.normalize('../../images/'),
    kube: {
        namespace: '/apis/jenkins.io/v1/namespaces/jx/',
        kubeFile: process.env['HOME'] + '/.kube/config'
    }
};

export function getImagePath(
    filename: string,
    theme: Theme = Theme.LIGHT
): string {
    return (
        theme === Theme.DARK ?
            path.join(config.imagesPath, Theme.DARK, filename) :
            path.join(config.imagesPath, filename)
    );
}

export default config;
