import {cleanDir} from './lib/fs';
import config from '../configs/config';

/**
 * Cleans up the output (build) directory.
 */
export default function clean() {
    return Promise.all([
        cleanDir(config.get('dist:patch'), {
            nosort: true,
            dot: true,
            ignore: []
        })
    ]);
}
