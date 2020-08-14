'use strict';

$('.form').click(function () {
    $(this).parent().find('.hidden').slideToggle();
});

$('#ubdatebutt').click(function () {
    $(this).parent().find('.ubdate').slideToggle();
});