
<script src="https://unpkg.com/optimization-js@latest/dist/optimization.js"></script>

<script src="./optimization.js"></script>
 <script>
 
// objective that needs to be minimized
fnc = function (v) {
  var result = 0.0;
  for (var i = 0; i < v.length; i++){
    result = result + v[i] * v[i]
  }
  return result;
};

var x0 = [1.0, -1.0, 0.5, -0.5, 0.25, -0.25]; // a somewhat random initial vector

// Powell method can be applied to zero order unconstrained optimization
var solution = optimjs.minimize_Powell(fnc, x0);

</script>