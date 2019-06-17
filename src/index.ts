import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
 * Initialization data for the jupyterlab_wordcount extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_wordcount',
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log('JupyterLab extension jupyterlab_wordcount is activated!');
  }
};

export default extension;
