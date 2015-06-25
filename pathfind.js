function pathfind(start, end, cities) {
  var closed_set = [], // already evaluated nodes
      open_set   = new BinaryHeap(function(x){
        return h_distance[x] || 1e6;
      }), // nodes to evaluate, prioritized on distance
      came_from  = {}, // map to look up movement sources 
      distance   = {}, // map to look up distance from start
      h_distance = {}; // distances including heuristic guess

  // Do this lookup now so we don't have to over and over later  
  var goal = cities[end];

  // Initialize starting distances for each city
  cities.forEach(function (city) {
    distance[city.id] = 1e6;
    h_distance[city.id] = 0;
  });

  // Of course, the start is 0 distance away from itself
  distance[start] = 0;
  h_distance[start] = city_distance(cities[start], cities[end]);

  // While there are still nodes to evaluate
  open_set.push(start);
  while (open_set.size() > 0) {
    var current_node = open_set.pop(); // reheaps
    var current_city = cities[current_node];
    
    // If we are at the end, rebuild the path taken and return it
    if (current_node == end) {
    
      // Rebuild the path taken
      var path_taken = [current_node.toString()],
          total_dist = 0; // sum of distances between each city
      while (current_node in came_from) {
        path_taken.push(came_from[current_node]);
        total_dist += city_distance(cities[came_from[current_node]], cities[current_node]);
        current_node = came_from[current_node];
      }
      
      return {
        'route':    path_taken.reverse(),
        'distance': total_dist
      };
    }
    
    // Put current_node in closedset so we don't come back
    closed_set.push(current_node);
    
    // Add each of current_node's neighbors to the open set
    for (var i = 0; i < current_city.roads.length; i++) {
      var road     = current_city.roads[i];
      var neighbor = road.to.id;
      
      // Don't add the road if it goes to a city we've already been to
      if (closed_set.indexOf(neighbor) > -1) {
        continue;
      }
      
      // Calculate travel distance
      var travel_distance = distance[current_node] + city_distance(current_city, road.to);
      
      var open_set_index = open_set.content.indexOf(neighbor);
      if (open_set_index == -1 || travel_distance < distance[neighbor]) 
      {
        came_from[neighbor]  = current_node;
        distance[neighbor]   = travel_distance;
        h_distance[neighbor] = travel_distance + city_distance(current_city, road.to);
        
        if (open_set_index == -1) {
          open_set.push(neighbor);
        }
      }
    }
  }
  
  // If we don't return with a solution in the loop, there is none to be found
  return {route: [], distance: -1};
}
