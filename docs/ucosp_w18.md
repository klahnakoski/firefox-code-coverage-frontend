# CodeCoverage - UCOSP Winter 2018

## Context

Firefox is a huge project, consisting of around 20K source files and 3M lines of code (if you only consider the Linux part!), supporting officially four operating systems, and being written in multiple programming languages (C/C++/JavaScript/Rust). We have around 200 commits landing per day in the mozilla-central repository, with developers committing even more often to the try repository. Usually, code coverage analysis is performed on a single language on small/medium size projects. Therefore, collecting code coverage information for such a project is not a small task. But code coverage can be used for many purposes, and at Mozilla, we have great ideas of how to use it to better the quality of each version of Firefox and to make a developers job easier by providing more data and easier testing.

## Goals

Mozilla has two long term goals for CodeCoverage.

### Is new source code covered by existing tests?

For a given changeset, what new lines of source code are covered? If new lines are not covered, are they important?  Should we write more tests?

The Release Management team will use this to spot trends of increased or decreased coverage by module (top level directory in the source tree) and work with module owners/managers to understand risks and plan future work. They will also use this data to look at coverage changes in soon-to-land, or landed, patches. 

*This interface has gone through a single iteration of feedback, and now needs polish: [See milestone](https://github.com/mozilla/firefox-code-coverage-frontend/milestone/4)*


### Per-test Coverage

For any file, for any revision, show what tests cover that file.

* Developers can determine what tests should be run based given the files they have changed.
* Component owners can inspect how tests overlap coverage, which will help determine if tests are redundant.

[This interface is is going through review now](https://github.com/mozilla/firefox-code-coverage-frontend/pull/76) and will soon be ready for a round of feedback from users within Mozilla. This feedback will undoubtedly generate a list of fixes and features to work on. 

*Coverage is not collected at a per-test level yet, but we hope to have some initial data after January*


## Deliverable

UCOSP students will make enhancements to the UI, as listed by the GitHub Issues. This will allow the student to acquire working experience in HTML, JSX, React and Javascript.


