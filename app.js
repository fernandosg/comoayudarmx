var handleFilterChange = function(e){
  var type = $("#donation_type").val(),
      location = $("#location").val(),
      lang = languagesModule && languagesModule.getCurrentLang(),
      state = {};

  // Populate state only with existing values
  if (type) { state.type = type };
  if (location) { state.location = location };
  if (lang && lang != 'es') { state.lang = lang };

  filterCards(state);
  history.replaceState(state, "", "?" + $.param(state));
}

var getUrlParameter = function(param) {
  var pageUrl = decodeURIComponent(window.location.search.substring(1)),
    urlVariables = pageUrl.split('&'),
    paramName,
    i;

  for (i = 0; i < urlVariables.length; i++) {
    paramName = urlVariables[i].split('=');

    if (paramName[0] === param) {
      return paramName[1] === undefined ? true : paramName[1];
    }
  }
};

var filterCardFromQueryParams = function() {
  var state = {type: getUrlParameter("type"), location: getUrlParameter("location")};
  $("#donation_type").val(state.type).trigger("chosen:updated");;
  $("#location").val(state.location).trigger("chosen:updated");
  filterCards(state);
}

var filterCards = function(state) {
  var $noResults = $("#no_results");

  var cardMatchFilter = function($card, filter) {
    return (!state[filter] || $card.find(".card__" + filter).text().includes(state[filter]) || state[filter] == "all")
  };

  var cardMatchFilters = function($card) {
    return cardMatchFilter($card, "type") && cardMatchFilter($card, "location");
  }

  var hasResults = function() {
    return $(".card").is(":visible");
  }

  $noResults.hide();

  $(".card").each(function() {
    var $card = $(this);

    if (cardMatchFilters($card)) {
      $card.show();
    } else {
      $card.hide();
    }
  })

  if(!hasResults()) {
    $noResults.show();
  }
}

var populateFilters = function(e) {
  var populateFilter = function(selectorInCard, filterSelector) {

    // Sort donations and locations
    var arr = $(selectorInCard).sort(function(a, b){
      if($(a).text() < $(b).text()) return -1;
      if($(a).text() > $(b).text()) return 1;
      return 0;
    })

    $(arr).each(function() {
      var option = $(this).text();
      if (!option.trim().length) return;
      var $select = $(filterSelector);
      var $option = $("<option>" + option + "</option>");

      if (!$select.text().includes(option)) {
        $select.append($option);
      }

    });
  }

  populateFilter(".card__type h3", "#donation_type");
  populateFilter(".card__location h3", "#location");

  $('select#donation_type').chosen()
  $('select#location').chosen()
}

var renderCards = function(cardsFromService) {
  Cards = cardsFromService;

  var template = $("#card_template").html();
  var monetaryType = "Monetaria";

  var isWorldPage = function() {
    return location.pathname.includes("world.html");
  };

  var isMonetaryCard = function(card) {
    return getCardTypes(card).indexOf(monetaryType) !== -1;
  };

  var getCardTypes = function(card) {
    if (Array.isArray(card.type)) {
      return card.type;
    }
    return [card.type];
  }

  var translateMonetaryType = function(type) {
    if (isWorldPage() && (type == monetaryType)) {
      return "Monetary";
    } else {
      return type;
    }
  }


  var renderIconType= function(type){
    var code = {
      "Artículos de limpieza":'paint-brush',
      "Artículos de aseo personal":'paint-brush',
      "Albergues":'bed',
      "Asesoría":'user-circle',
      "Asesoría profesional":'user-circle',
      "Especie":'cutlery',
      "Equipo de auxilio médico":'medkit',
      "Equipo de rescate":'life-ring',
      "Herramientas":'wrench',
      "Limpieza":'paint-brush',
      "Medicamentos":'medkit',
      "Monetaria":'money',
      "Ropa":'shopping-bag',
      "Sangre":'tint',
      "Trabajo Voluntario":'users',
      "Transporte":'truck',
      "Veterinario":'paw',
      "Víveres":'cutlery'
    };
    return '<i class="fa fa-'+code[type]+'"></i>&nbsp;';

  };

  var renderCardTypes = function($card, types) {
    var template = $card.find(".card__type h3").clone();
    template.find('i').remove();
    $card.find(".card__type h3").remove();
    types.forEach(function(type) {
      $card.find(".card__type").append(template.clone().append(renderIconType(type)+"<span>" + translateMonetaryType(type) + "</span>"));
    });
  }

  var renderBadges = function($card, card) {
    if(card.verified) {
      $card.find(".card__badges").append('<span class="badge-verified" ><i class="fa fa-check"></i> Fuente Oficial</span>');
    }
  }

  var renderCard = function(card) {
    var $card = $(template);
    var $location = $("<span>" + card.location + "</span>");

    $card.find(".card__title").text(card.title);
    renderBadges($card, card);
    $card.find(".card__desc").text(card.description);
    renderCardTypes($card, getCardTypes(card));
    $card.find(".card__location h3").append($location);
    $card.find(".card__button").attr("href", card.link);
    $("#cards_container").append($card);
  };

  if (isWorldPage()) {
    Cards.filter(isMonetaryCard).forEach(renderCard);
  } else {
    Cards.forEach(renderCard);
  }
}

var start = function(cards) {
  renderCards(cards);
  populateFilters();
  filterCardFromQueryParams();
}

var renderCollectionCard=function(card){
  var template = $("#collection_center_card_template").html();
  var $card = $(template);
  $card.find(".card__title").text(card.nombre);
  $card.find(".card__desc").text(card.direccion);
  if(card.geopos!=null){
    var btn=$card.find(".collection_center_card_button_show_map");
    $(btn).show();
    btn.data("latlng",card.geopos.lat+","+card.geopos.lng);
  }
  $("#cards_container").append($card);
}

var startCollectionCentersCards = function(cards) {
  cards.forEach(function(card){
    renderCollectionCard(card);
  })
}

var getCards = function() {
  var getEntryProperty = function(entry, propName) {
    return entry['gsx$' + propName] && entry['gsx$' + propName]['$t']
  }

  var formatType = function(type) {
    var types = type.split(',');

    return types.map(function (type) {
      return type.trim();
    });
  }

  var isApprovedCard = function (card) {
    return card.approved === 'TRUE';
  }

  var buildCard = function(entry) {
    return {
      timespamp: getEntryProperty(entry, 'timestamp'),
      title: getEntryProperty(entry, 'formadeayuda'),
      description: getEntryProperty(entry, 'informaciónadicionaldeayuda'),
      type: formatType(getEntryProperty(entry, 'tipodedonación')),
      location: getEntryProperty(entry, 'puedesayudardesde'),
      link: getEntryProperty(entry, 'fuentedeinformaciónlink'),
      adicional: getEntryProperty(entry, 'informaciónadicional'),
      verified: getEntryProperty(entry, 'verified'),
      approved: getEntryProperty(entry, 'approved')
    }
  }

  $.get(
    'https://spreadsheets.google.com/feeds/list/1zAFK1sSjIaHurnKzLx-e3GJZNmZ9QWfFSlIZLyYk8IE/1/public/values?alt=json',
    function (data) {
      start(
        data.feed.entry.map(buildCard).filter(isApprovedCard)
      );
    }
  );
}

var fetchDataScrollFromAcopioAPI=function(url,params,callback){
  $.ajax({
    url:url,
    data:params
  }).done(function(data){
    callback(data);
  })
}

var getCollectionCenters=function(){
  fetchDataScrollFromAcopioAPI(Global.ACOPIO_API.BALTERBYTE+Global.ACOPIO_API.ACTION.ACOPIOS_ALL,{filter:{"limit":6,"offset":0}},function(data){
    startCollectionCentersCards(data);
  });
}

var InfiniteScroll=function(config){
  var configuration=config;
  var callback,scrollFn;

  var next=function(){
    configuration.filter.offset+=1;
    scrollFn(configuration.URL,configuration);
  }
  var addScrollFn=function(fn){
    scrollFn=fn;
  }
  return{
    addScrollFn:addScrollFn,
    next:next
  }
}

$(document).on("change", "#donation_type", handleFilterChange);
$(document).on("change", "#location", handleFilterChange);
$(document).ready(function(){
  getCards();
  getCollectionCenters();
  var window_ob=$(window);
  var inf_scroll=new InfiniteScroll({URL:Global.ACOPIO_API.BALTERBYTE+Global.ACOPIO_API.ACTION.ACOPIOS_ALL,filter:{"limit":6,"offset":0}});
  inf_scroll.addScrollFn(function(url,params){
    fetchDataScrollFromAcopioAPI(url,params,function(data){
      startCollectionCentersCards(data);
    });
  });

  window_ob.scroll(function(){
    if ($(document).height() - window_ob.height() == window_ob.scrollTop()) {
      inf_scroll.next();
    }
  });
})
