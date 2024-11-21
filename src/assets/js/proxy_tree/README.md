# Computed copy



# Vue Devtools compatibility

- You can't seem to inspect the data from a TreeNode via Vue devtools. The reason for that is unknown, but keep in mind
  that
- To show the actual data you will need to access the proxy target via __target__ or something like this.

# TODO

- useNodeCopy: dependencyTracking needs to be deep! Currently the dependencies are tracked via 