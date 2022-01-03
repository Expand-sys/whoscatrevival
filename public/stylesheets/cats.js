const numCols = 3;
const colHeights = Array(numCols).fill(0);
const container = document.getElementById('masonry-with-columns');
Array.from(container.children).forEach((child, i) => {
  const order = i % numCols;
  child.style.order = order;
  colHeights[order] += parseFloat(child.clientHeight);
})
container.style.height = Math.max(...colHeights) + 'px';
