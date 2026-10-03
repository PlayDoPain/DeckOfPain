/* Minimal YAML reader: nested maps, scalars (yes/no/true/false/numbers/strings), # comments.
   Enough for config/game.yaml; not a general YAML parser. */
window.DOP = window.DOP || {};
DOP.parseYaml = function (text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  const scalar = (s) => {
    s = s.trim();
    if (/^(yes|true)$/i.test(s)) return true;
    if (/^(no|false)$/i.test(s)) return false;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    return s.replace(/^(["'])(.*)\1$/, '$2');
  };
  text.split(/\r?\n/).forEach((raw) => {
    const line = raw.replace(/(^|\s)#.*$/, '');
    if (!line.trim()) return;
    const indent = line.match(/^ */)[0].length;
    const m = line.trim().match(/^([^:]+):\s*(.*)$/);
    if (!m) return;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    const key = m[1].trim();
    if (m[2] === '') {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else {
      parent[key] = scalar(m[2]);
    }
  });
  return root;
};
