Source: https://github.com/EclipseFdn/open-vsx.org/wiki/Auto-Publishing-Extensions

# Auto Publishing Extensions

The public registry at open-vsx.org maintains a special service account, @open-vsx, that has the ability to publish extensions from the Visual Studio Marketplace to open-vsx.org. There is a job that runs nightly that takes a [list of extensions](https://github.com/open-vsx/publish-extensions/blob/master/extensions.json) as input and, if an extension has changed since last published, attempts to repackage and republish the extension.

If you are the author of the extension and you wish to have it published to [open-vsx.org](https://open-vsx.org), the best option is to publish it yourself, e.g. using GitHub actions in your repository.

Example job snippet:

```yaml
test-and-build: ... # build and upload your extension
publish-to-openvsx:
  name: Publish to Open VSX Registry 📦
  needs:
    - test-and-build
  runs-on: ubuntu-latest
  steps:
    - name: Download the extension package
      uses: actions/download-artifact@v4
      with:
        name: vscode-extension-package
        path: dist/
    - name: Publish to Open VSX Registry
      run: npx ovsx publish dist/*.vsix
      env:
        OVSX_PAT: ${{ secrets.OVSX_PAT }}
```

You can also find a GitHub action that allows publishing to Open VSX at [HaaLeo/publish-vscode-extension](https://github.com/HaaLeo/publish-vscode-extension).

If you are not the author, we suggest you first reach out to the author with an issue in their GitHub repo to request that they publish their extension to [open-vsx.org](https://open-vsx.org/) or add it to the auto-publish list.

## Request an Extension be Auto-Published

To request for an extension to be auto-published, simply submit a pull request to add it to extensions.json in the open-vsx/publish-extensions repo. For your pull request to be approved and merged, you must have first signed the [Eclipse Committer Agreement](https://www.eclipse.org/legal/eca/).

The format for an entry in the extensions.json file is as follows:

```json
"<publisher>.<name>": {
  "repository": "https://github.com/<owner>/<repo>"
}
```

where publisher and name are the corresponding fields in the package.json of the extension.

If you are not the author, the extension must be offered under an open source license in order to be added to the auto-publish list.

## Remove an Extension from the Auto-Publish List

If you are the author of an extension that is currently being auto-published and wish to remove it, simply submit a pull request to the extensions.json file mentioned above to have your extension removed.
