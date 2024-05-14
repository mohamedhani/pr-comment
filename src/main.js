const core = require('@actions/core')
const github = require('@actions/github')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const owner = core.getInput('owner', { required: true })
    const repo = core.getInput('repo', { required: true })
    const prNumber = core.getInput('pr_number', { required: true })
    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    })
    let filesStatus = {
      addedFiles: 0,
      modifiedFiles: 0,
      deletedFile: 0
    }
    filesStatus = files.reduce((acm, file) => {
      acm.addedFiles += file.status === 'added' ? 1 : 0
      acm.modifiedFiles += file.status === 'modified' ? 1 : 0
      acm.deletedFile += file.status === 'removed' ? 1 : 0
    }, filesStatus)
    console.log(filesStatus)
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: `The Status Of files for Pull Request ${prNumber} is 
              Added Files: ${filesStatus.addedFiles}
              Modified Files: ${filesStatus.modifiedFiles}
              Deleted Files: ${filesStatus.deletedFile}
      `
    })
    const labels = new Set()
    for (const file in files) {
      const extention = file.filename.split('.').pop()
      switch (extention) {
        case 'md':
          labels.add('docs')
          break
        case 'yml':
        case 'yaml':
          labels.add('yaml')
          break
        case 'go':
          labels.add('golang')
          break
        case 'js':
        case 'ts':
          labels.add('javascript')
          break
        case 'py':
          labels.add('python')
          break
        case 'java':
          labels.add('java')
          break
        case 'gem':
          labels.add('ruby')
          break
        default:
          labels.add('undefined')
      }
    }
    octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: prNumber,
      labels: Array.from(labels)
    })
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
