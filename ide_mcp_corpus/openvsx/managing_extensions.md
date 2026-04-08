Source: https://github.com/EclipseFdn/open-vsx.org/wiki/Managing-Extensions

# Managing Extensions

## Deleting an Extension

Warning: Deleting an extension version or entire extension is permanent, it cannot be undone. Please take care!

The Open VSX service offered at [https://open-vsx.org](https://open-vsx.org) is used by developers around the world to support their daily work. Deleting an extension may break the workflows of other developers. You may want to consider deprecating your extension first for a period of time before deleting it.

To delete an extension, select your Open VSX profile in the upper right and then 'Settings' and 'Extensions'. The tiles for the extensions you have published have a small red trash can icon in the upper right. Click the trash can and you'll see a list of the versions you have published. Select one or more versions to delete.

### Deleting Selected Versions

When only a subset of the available versions are deleted, the extension remains available. In case an extension with an alias is removed (latest or preview), the alias is automatically reassigned. The latest alias points to the highest version number that is not marked as preview, while preview points to the highest version number that is marked as preview.

### Deleting All Versions

When all versions of an extension are deleted, the whole extension with associated metadata (e.g. download count, user ratings) is deleted. That means all requests to the extension id, which consists of the combination of namespace and extension name, will fail.

Extensions can depend on each other in two ways: via extensionDependencies and extensionPack (see [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)). It is not possible to delete all versions of an extension if there are other extensions that depend on it. Those dependent extensions would first need to be deleted or modified to remove the dependencies. If there are dependencies you do not own on your extensions you wish to delete, first try reaching out to the publisher of the dependent extensions. If that fails, open an issue here.

## Deprecating an Extension

An alternative to deleting an extension is to mark it as deprecated. You can optionally make it not downloadable and/or point to a replacement extension. Deprecated extensions are marked visually in the Open VSX UI.

To deprecate an extension, submit a pull request to extensions.json in [openvsx/publish-extensions/extension-control](https://github.com/open-vsx/publish-extensions/tree/master/extension-control).

Note, the extensions.json file of deprecated extensions is processed by a batch job that runs nightly. So, once your PR is merged, you should see your extension deprecated the next day.

## Renaming an Extension

Currently, there is no explicit support to rename an extension. You will need to delete and re-publish it under the new name. Reviews and download statistics will not transfer.

## Moving an Extension between Namespaces

Currently, there is no explicit support to moving an extension between namespaces. You can however, rename a namespace and optionally converge it with an existing namespace. This will affect all extensions in the namespace. See [Managing Namespaces](https://github.com/EclipseFdn/open-vsx.org/wiki/Managing-Namespaces)
