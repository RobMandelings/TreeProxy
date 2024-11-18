# Proxies

- I have used proxies for base proxy node. __v_raw returns UNDEFINED on this node, so vue devtools will not work with
  it.
- This is because assignments from this node into a reactive object unwraps the proxy.