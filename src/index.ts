import {
    INotebookTracker
} from '@jupyterlab/notebook';

import {
  Widget
} from '@phosphor/widgets';

import {
//  CodeCell,
//  CodeCellModel, 
//  MarkdownCell,
  Cell
} from '@jupyterlab/cells';

import {
  Message
} from '@phosphor/messaging';

import {
  ICommandPalette
} from '@jupyterlab/apputils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ToolbarButton
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  NotebookPanel, INotebookModel
} from '@jupyterlab/notebook';

import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
* Create the toolbar button
*/
class WordCountButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  constructor(app: JupyterLab) {
    this.app = app;
  }

  readonly app: JupyterLab;

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    // Create the on-click callback for the toolbar button.
    let wordCount = () => {
      this.app.commands.execute('wordcount:open');
    };
    
    // Create the toolbar button 
    let button = new ToolbarButton({
      className: 'wordCountButton',
      iconClassName: 'fa fa-calculator',
      onClick: wordCount,
      tooltip: 'Count the number of words'
    });
    
    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(6, 'wordCount', button);
    
    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return button;
  }
}

/**
* Create the Widget
*/
class WordCountWidget extends Widget {

  constructor(cells: ReadonlyArray<Cell>) {
    super();

    this.id = 'wordcount-jupyterlab';
    this.title.label = 'Wordcount';
    this.title.closable = true;
    this.addClass('jp-wordCountWidget');

    this.div = document.createElement('div');
    this.div.className = 'jp-wordCount';
    this.node.appendChild(this.div);

    this.cells = cells;
  }

  readonly div: HTMLDivElement;
  readonly cells: ReadonlyArray<Cell>;

  /**
   * Handle update requests for the widget
   */
  onUpdateRequest(msg: Message): void {

    // First get all text from all markdown cells
    var all_lines: string[];
    all_lines = [];
    var count_code_lines = 0;
    for (let cell of this.cells) {
      let model = cell.model;
      if (model.type === 'markdown') {
        let contents = cell.model.value.text;
        if (contents) {
          all_lines = all_lines.concat(contents.split('\n'));
        }
      } else if (model.type === 'code') {
        let contents = cell.model.value.text;
        if (contents) {
          count_code_lines = count_code_lines + contents.split('\n').length;
        }
      }
    }

    // Count words
    var headings: string[];
    headings = [];
    var wordcounts: number[];
    wordcounts = [];
    var counter = 0;
    for (let line of all_lines) {
      // Look for a heading
      let match = line.match(/^\s*([#]{1,6}) (.*)/);
      if (match) {
        // We only want level 1 headings
        if (match[1].length === 1) {
          headings.push(match[2]);
          if (headings.length > 1) {
            wordcounts.push(counter);
          }
          counter = 0;
        }
      } else {
        // No heading found, count words
        counter = counter + line.split(' ').length;
      }
    }
    // Don't forget the last one
    wordcounts.push(counter);

    // Populate div
    var text: string;
    text = '<h1 class="jp-wordCountTitle">Count of words</h1>\n<div class="jp-wordCountList">';
    for (let h in headings) {
      text = text + "<p>" + headings[h] + ": " + wordcounts[h] + " words" + "</p>";
    }
    text = text + '</div><p class="jp-wordCountSubtitle">(Total ' + wordcounts.reduce((a, b) => a + b, 0) + ' words, ' + count_code_lines + ' code lines)</p>' 
    this.div.innerHTML = text;
  }
};


/**
 * Activate the jupyterlab_wordcount extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, tracker: INotebookTracker) {
  // Create a single widget
  let widget: WordCountWidget;

  // Add an application command
  const command: string = 'wordcount:open';
  app.commands.addCommand(command, {
    label: 'Count the number of words',
    execute: () => {
      if (!widget) {
        widget = new WordCountWidget(tracker.currentWidget.content.widgets);
        widget.update();
      }
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.addToMainArea(widget);
      } else {
        widget.update();
      }
      // Activate the widget
      app.shell.activateById(widget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({command, category: 'Notebook Operations'});

  // Add button to toolbar
  let buttonExtension = new WordCountButtonExtension(app);
  app.docRegistry.addWidgetExtension('Notebook', buttonExtension);

  // Add a context menu option
  app.contextMenu.addItem({
    selector: '.jp-Notebook',
    command: command,
    rank: -0.5
  });
};


/**
 * Initialization data for the jupyterlab_wordcount extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_wordcount',
  autoStart: true,
  requires: [ICommandPalette, INotebookTracker],
  activate: activate
};

export default extension;
