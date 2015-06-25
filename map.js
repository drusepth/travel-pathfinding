$(document).ready(function () {

  // Scale the canvas up to fill the entire page
  var canvas = document.getElementById('map');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // Allow the user to override random N cities by using map.html#200
  var num_cities = Math.floor((Math.random() * 300) + 200);
  if (window.location.hash.length > 0) {
    // Assume the user passes in a valid int
    num_cities = parseInt(window.location.hash.replace('#', ''));
  }
  
  // Generate that many random cities
  var cities = generate_cities(canvas, num_cities);
  
  // Randomly connect them with roads
  connect_cities(canvas, cities); // changes cities object
  
  // Draw the map on the page
  draw_map(canvas, cities);
  
  // Because we're using %-based positioning, we want to re-draw the canvas (roads)
  // whenever a user resizes or zooms the window
  $(window).resize(function () { draw_map(canvas, cities); });
});

// Generates N random cities, returns hash of their locations
function generate_cities(canvas, n) {

  var cities = [];
  for (var i = 0; i < n; i++) {
    cities.push({
      'id': i.toString(),
      'name': 'City #' + (i + 1).toString(),
      'x': Math.floor((Math.random() * canvas.width)),
      'y': Math.floor((Math.random() * canvas.height)),
      'roads': [] // connections to other cities
    });
  }
  
  return cities;
}

// Randomly connect cities by roads, augments cities hash with connections
function connect_cities(canvas, cities) {
  // Max distance any two cities can be can be calculated by finding the distance
  // between a city at (0, 0) and a city at (MAX_X, MAX_Y)
  var max_distance = city_distance({'x':0,'y':0}, {'x':canvas.width,'y':canvas.height});

  // for each city,
  cities.forEach(function (city) {

    // judge it's distance to all other cities
    cities.forEach(function (other_city) {
      // ignore it if it's the same city as where we're coming from
      if (city == other_city) {
        return; // ignore this pairing
      }
      
      // the closer the city, the more likely to build a road between them
      var distance = city_distance(city, other_city);
      if (distance / max_distance < Math.random() * 0.075) {
        // Build the road with that distance
        add_road(city, other_city, distance);
      }
    });

  });
}

// Draws cities and roads on page
function draw_map(canvas, cities) {
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scale up to CSS-provided size, not original canvas size
  ctx.canvas.width  = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
  
  // Plot the cities
  cities.forEach(function (city) {

    // Place hitboxes on top of each city for click events & better styling
    var hitbox = $('<div />')
      .addClass('city')
      .attr('style', 'position: absolute; top: ' + city.y + '; left: ' + city.x)
      .attr('city-id', city.id)
      .click(function () {
        // If on other city is also selected, then find a path from it to here
        if ($('.selected').length == 1) {
          var path = pathfind(
            $('.selected').first().attr('city-id'), // start: already-highlighted city
            $(this).attr('city-id'), // end: this city
            cities
          );

          // Light the way! (draw the path in gold)
          draw_path(canvas, path.route, cities);
          
          // And provide a friendly card with the total distance to travel
          draw_path_card(path, cities);

          $('.city').removeClass('selected');
        } else {
          // Otherwise, select this city so we can pathfind from it next time
          $(this).addClass('selected');
        }
      });

    hitbox.appendTo($('body'));

    // And plot all roads out from this city
    city.roads.forEach(function (road) {
      ctx.strokeStyle = '#cdcdcd';
      ctx.beginPath();
      ctx.moveTo(city.x, city.y);
      ctx.lineTo(road.to.x, road.to.y);
      ctx.stroke();
    });

  });
  
}

// Draw a golden road along a path of cities
function draw_path(canvas, path, cities) {
  // Draw the world's roads first
  draw_map(canvas, cities);
  
  // And then draw our yellow brick road on top
  var ctx = canvas.getContext('2d');

  for (var i = 0; i < path.length - 1; i++) {
    var current_city = cities[path[i]],
        next_city    = cities[path[i + 1]];
    
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(current_city.x, current_city.y);
    ctx.lineTo(next_city.x, next_city.y);
    ctx.stroke();
  }
}

// Serve up an informational card about the path displayed
function draw_path_card(path, cities) {
  // Close all existing cards
  $('.card').hide();

  var card = $('<div />').addClass('card');
  var route = path.route;

  // Give the card its text  
  if (path.route.length > 0) {
    card.html([
      'From ' + cities[route[0]].name +
      ' to ' + cities[route[route.length - 1]].name +
      ' is a trip through ' + Math.floor(path.distance) + ' <em>exciting</em> pixels' +
      ' and ' + route.length + ' cities. '
    ].join(''));
  } else {
    card.text("There aren't any roads connecting these two cities yet. Try back in a few years. ");
  }
  
  // Add a "close" link to card in case user wants to
  card.append($('<a />').text('Okay.').attr('href', '#').click(function () {
    card.fadeOut();
  }));
  
  $('body').append(card);
}

// Add a road from one point to another with a given distance
function add_road(start, end, distance) {
  // add the road
  start.roads.push({'to': end, 'distance': distance});
  
  // and assume inter-city roads aren't one-way
  end.roads.push({'to': start, 'distance': distance});
}

// Returns bird-flight distance between two cities
function city_distance(start, end) {
  return Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2));
}
