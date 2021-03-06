(function ($) {

    var Details = function ($container, options) {
        var obj = this;
        jQuery.extend(obj.options, options);
        var $form            = $('.bookly-js-staff-details', $container),
            $staff_full_name = $('#bookly-full-name', $container),
            $staff_wp_user   = $('#bookly-wp-user', $container),
            $staff_email     = $('#bookly-email', $container),
            $staff_phone     = $('#bookly-phone', $container),
            $staffLocations  = $('#bookly-js-locations', $container)
        ;

        if (obj.options.intlTelInput.enabled) {
            $staff_phone.intlTelInput({
                preferredCountries: [obj.options.intlTelInput.country],
                initialCountry    : obj.options.intlTelInput.country,
                geoIpLookup       : function (callback) {
                    $.get('https://ipinfo.io', function () {
                    }, 'jsonp').always(function (resp) {
                        var countryCode = (resp && resp.country) ? resp.country : '';
                        callback(countryCode);
                    });
                },
                utilsScript: obj.options.intlTelInput.utils
            });
        }

        $staff_wp_user.on('change', function () {
            if (this.value) {
                $staff_full_name.val($staff_wp_user.find(':selected').text());
                $staff_email.val($staff_wp_user.find(':selected').data('email'));
            }
        });

        $staffLocations.booklyDropdown();

        $container
            .on('click', '.bookly-thumb label', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var frame = wp.media({
                    library: {type: 'image'},
                    multiple: false
                });
                frame
                    .on('select', function () {
                        var selection = frame.state().get('selection').toJSON(),
                            img_src;
                        if (selection.length) {
                            if (selection[0].sizes['thumbnail'] !== undefined) {
                                img_src = selection[0].sizes['thumbnail'].url;
                            } else {
                                img_src = selection[0].url;
                            }
                            $container.find('[name=attachment_id]').val(selection[0].id).trigger('change');
                            $('#bookly-js-staff-avatar').find('.bookly-js-image').css({'background-image': 'url(' + img_src + ')', 'background-size': 'cover'});
                            $('.bookly-thumb-delete').show();
                            $(this).hide();
                        }
                    });

                frame.open();
            })
            // Delete staff avatar
            .on('click', '.bookly-thumb-delete', function () {
                var $thumb = $(this).parents('.bookly-js-image');
                $thumb.attr('style', '');
                $container.find('[name=attachment_id]').val('').trigger('change');
                $('.bookly-thumb-delete').hide();
            })
            // Save staff member details.
            .on('click', '#bookly-details-save', function (e) {
                e.preventDefault();
                let ladda = Ladda.create(this),
                    data         = $form.serializeArray(),
                    $staff_phone = $('#bookly-phone', $form),
                    phone;
                ladda.start();
                // for BooklyPro listener in archive.js
                // When button disabled, listeners don't process
                $(this).removeAttr('disabled');

                try {
                    phone = obj.options.intlTelInput.enabled ? $staff_phone.intlTelInput('getNumber') : $staff_phone.val();
                    if (phone == '') {
                        phone = $staff_phone.val();
                    }
                } catch (error) {  // In case when intlTelInput can't return phone number.
                    phone = $staff_phone.val();
                }
                data.push({name: 'action', value: 'bookly_update_staff'});
                data.push({name: 'phone', value: phone});
                data.push({name: 'csrf_token', value: BooklyL10nGlobal.csrf_token});
                $.ajax({
                    type: 'POST',
                    url: ajaxurl,
                    data: data,
                    dataType: 'json',
                    xhrFields: {withCredentials: true},
                    crossDomain: 'withCredentials' in new XMLHttpRequest(),
                    success: function (response) {
                        if (response.success) {
                            obj.options.saving({success: [obj.options.l10n.saved]}, response.data.staff);

                            $('.bookly-js-staff-name').text($('#bookly-full-name', $form).val());
                        } else {
                            obj.options.saving({error: [response.data.error]});
                        }
                        ladda.stop();
                    }
                });
            })
            .on('click', 'button:reset', function () {
                setTimeout(function () {
                    $staffLocations.booklyDropdown('reset');
                }, 0);
            });
    };

    Details.prototype.options = {
        intlTelInput: {},
        l10n: {},
        saving: function (alerts, data) {
            $(document.body).trigger('staff.saving', [alerts]);
            if (alerts.hasOwnProperty('success')) {
                $(document.body).trigger('staff.saved', ['staff-details', data]);
            }
        }
    };

    window.BooklyStaffDetails = Details;
})(jQuery);