import React, { Component } from 'react';

import * as FetchAPI from '../utils/fetch_data';
import * as Color from '../utils/color';
import * as Log from '../utils/log';
import { TestsSideViewer, CoveragePercentageViewer } from './fileviewercov';

const queryString = require('query-string');
const _ = require('lodash');

/* FileViewer loads a raw file for a given revision from Mozilla's hg web.
 * It uses test coverage information from Active Data to show coverage
 * for runnable lines.
 */
export default class FileViewerContainer extends Component {
  constructor(props) {
    super(props);

    /* app status */
    this.status = {}; //placeholder until something real exists

    this.state = {
      /* app data */
      parsedFile: [],
      coverage: {
        coveredLines: [],
        uncoveredLines: [],
        allTests: [],
        testsPerHitLine: [],
        testsPerMissLine: [],
      },
      selectedLine: undefined,
    };

    /* get revision and path parameters from URL */
    const parsedQuery = queryString.parse(props.location.search);
    if (!parsedQuery.revision || !parsedQuery.path) {
      this.status.setState({
          app: "Undefined URL query ('revision', 'path' fields are required)",
      });
    }
    /* remove beginning '/' in the path parameter */
    else if (parsedQuery.path.startsWith('/')) {
      parsedQuery.path = parsedQuery.path.slice(1);
    }
    this.revision = parsedQuery.revision;
    this.path = parsedQuery.path;
  }

  async componentDidMount() {
    /* Get source code and coverage in parallel  */
    await Promise.all([this.getSourceCode(), this.getCoverage()]);
  }

  /* Get source code from hg */
  async getSourceCode(revision = this.revision, path = this.path) {
    try {
      const text = await FetchAPI.getRawFile(revision, path);
      this.status.setState({
        fetch_source: true
      });
      this.setState({
        parsedFile: text.split('\n')
      });
    } catch (error) {
      console.error(error);
      this.status.setState({
        app: 'We did not manage to fetch source file from hg.mozilla',
        fetch_source: false
      });
    }
  }

  /* Get coverages from ActiveData */
  async getCoverage(revision = this.revision, path = this.path) {
    try {
      const activeData = await FetchAPI.query({
        from: 'coverage',
        where: {
          and: [
            { eq: { 'source.file.name': `${path}` } },
            { eq: { 'repo.changeset.id12': `${revision}` } },
          ],
        },
        limit: 1000,
        format: 'list',
      });
      this.status.setState({
          fetch_coverage: true
      });
      this.setState({
        coverage: this.parseCoverage(activeData.data)
      });
    } catch (error) {
      console.error(error);
      this.status.setState({
        app: 'We did not manage to fetch test coverage from ActiveData',
        fetch_coverage: false
      });
    }
  }

  /* Parse coverage data */
  parseCoverage(data) {
    const covered = [];
    const uncovered = [];
    const testsPerHitLine = [];
    const testsPerMissLine = [];

    data.forEach((d) => {
      d.source.file.covered.forEach((line) => {
        covered.push(line);
        if (!testsPerHitLine[line]) {
          testsPerHitLine[line] = [];
        }
        testsPerHitLine[line].push(d);
      });
    });

    data.forEach((d) => {
      d.source.file.uncovered.forEach((line) => {
        if (!testsPerHitLine[line]) {
          uncovered.push(line);
          if (!testsPerMissLine[line]) {
            testsPerMissLine[line] = [];
          }
          testsPerMissLine[line].push(d);
        }
      });
    });

    return {
      coveredLines: _.uniq(covered),
      uncoveredLines: _.uniq(uncovered),
      allTests: data,
      testsPerHitLine,
      testsPerMissLine,
    };
  }

  render() {
    const self = this;
    const {coverage} = self.state;

    /* This component renders each line of the file with its line number */
    const FileViewer = () => (
      <table className="file-view-table">
        <tbody>
          {
            self.state.parsedFile.map((line, lineNumber) => (
              <Line
                lineNumber={lineNumber + 1}
                lineText={line}
              />
            ))
          }
        </tbody>
      </table>
    );

    const Line = ({ lineNumber, lineText}) => {
      const handleOnClick = () => {
        self.setState({selectedLine: lineNumber});
      };

      const lineClass = (lineNumber === self.state.selectedLine) ? 'selected' : 'unselected';

      // default line color
      let nTests;
      let color = '#ffffff';
      // hit line
      if (coverage.coveredLines.find(element => element === lineNumber)) {
        nTests = coverage.testsPerHitLine[lineNumber].length;
        color = Color.getLineHitCovColor(nTests / coverage.allTests.length);
      }
      // miss line
      else if (coverage.uncoveredLines.find(element => element === lineNumber)) {
        color = '#ffe5e5';
      }

      return (
        <tr className={`file_line ${lineClass}`} onClick={handleOnClick} style={{ backgroundColor: `${color}` }}>
          <td className="file_line_number">{lineNumber}</td>
          <td className="file_line_tests">
            { nTests && <span className="tests">{nTests}</span> }
          </td>
          <td className="file_line_text"><pre>{lineText}</pre></td>
        </tr>
      );
    };

    /* This component contains metadata of the file */
    const FileViewerMeta = ({self}) => {
      console.log("run render");
      return (
        <div className="file-meta-viewer">
          <div className="file-meta-center">
            <div className="file-meta-title">File Coverage</div>
            <CoveragePercentageViewer
              coverage={self.state.coverage}
            />
            <FileViewerStatus ref={
              c => {
                console.log("assign:" +c);
                if (c) self.status = c
              }
            }/>
          </div>
          {self.status.app && <span className="error_message">{self.status.app}</span>}

          <div className="file-summary">
            <div className="file-path">{self.path}</div>
          </div>
          <div className="file-meta-revision">revision number: {self.revision}</div>
        </div>
      );
    };

    return (
      <div>
        <div className="file-view">
          <FileViewerMeta self={this}/>
          <FileViewer/>
        </div>
        <TestsSideViewer
          coverage={coverage}
          lineNumber={self.state.selectedLine}
        />
      </div>
    );
  }
}



class FileViewerStatus extends Component {
  constructor(props) {
    console.log("make fileviewer status");
    super(props);
    this.state = {};
  }

  render() {
    Log.note("render status");
    const showStatus = (label, fetched) => {
      let msg;
      if (fetched === undefined) {
        msg = 'Fetching...';
      } else if (fetched === true) {
        msg = <span>&#x2714;</span>; // heavy checkmark
      } else if (fetched === false) {
        msg = <span>&#x2716;</span>; // heavy multiplication x
      }
      return (<li className="file-meta-li">{label}: {msg}</li>);
    };

    return (
      <div className="file-meta-status">
        <ul className="file-meta-ul">
          {showStatus('Source code', this.state.fetch_source)}
          {showStatus('Coverage', this.state.fetch_coverage)}
        </ul>
      </div>
    );
  }
}

