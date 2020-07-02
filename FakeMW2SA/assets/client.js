var memberjoin = false;

function reload() {
    jsonresponse = $.ajax("/?action=players&csrf=" + csrf).done(function() {
        data = jsonresponse.responseJSON["players"];
        host = jsonresponse.responseJSON["host"];
        apicalls = jsonresponse.responseJSON["apicalls"];
        partystatepackets = jsonresponse.responseJSON["partystatecount"];
        memberjoinpackets = jsonresponse.responseJSON["memberjoincount"];
        ipaddresses = jsonresponse.responseJSON["ipaddresses"];
        var partygroups = [];

        function checkparty(i) {
            return i.partyID
        }

        var index = 0
        for (i = 0; i < data.length; i++) {
            var temp = data.filter(function(a) {
                return (a.partyID == i);
            });
            if (temp[0] != null) {
                lastseens = [];
                temp2 = [];
                temp.forEach(function(item) {
                    lastseens.push(item.lastseen);
                });
                biggest = Math.max(...lastseens);
                temp.forEach(function(item) {
                    if (item.lastseen != biggest) {
                        item.partyID = 0;
                        partygroups.push([item]);
                    } else {
                        temp2.push(item);
                    }
                });
                if (temp2.length > 0) {
                    partygroups.push(temp2);
                }
            }
        }

        function sortem(array) {
            array.sort(function(a, b) {
                return (b.lastseen - a.lastseen)
            })
        }

        function cleanarray(array, index) {
            // ??
        }

        partygroups.forEach(cleanarray)
        partygroups.forEach(sortem)

        partygroups.sort(function(a, b) {
            return (b[0].lastseen - a[0].lastseen)
        })

        newdata = []
        for (a = 0; a < partygroups.length; a++) {
            for (i = 0; i < partygroups[a].length; i++) {
                newdata.push(partygroups[a][i])
            }
        }

        data = newdata;
        var ts = Math.round((new Date()).getTime() / 1000);
        populate();
    })
}

function vac(player) {
    if (player.vacbanned == 1) {
        if (player.numberofvacbans > 1) {
            var s = "s";
        } else {
            var s = "";
        }
        return player.numberofvacbans + " VAC ban" + s + " " + Math.floor((new Date).getTime()/86400000 - player.dateoflastban/86400) + " days ago";
    } else {
        return "False";
    }
}

function rank(player) {
    if (player.presteige > 1) {
        if (player.presteige > 10) {
            return "Prestige" + 11;
        } else {
            return "Prestige" + player.presteige;
        }
    } else {
        return parseInt(player.level) + 1;
    }
}

function playerlocation(player) {
    result = "";
    if (player.country != null) {
        result += player.country;
        if (player.region != null) {
            result += ", " + player.region;
            if (player.city != null) {
                result += ", " + player.city;
            }
        }
    }
    return result;
}

function checkban(player) {
    if (player.banned == "True") {
        return " bg-danger"
    } else {
        return ""
    }
}

function playerhost(player) {
    if (player.host == true) {
        return "host";
    } else {
        return "";
    }
}

function populate() {
    var ts = Math.round((new Date()).getTime() / 1000);
    $('#playertable').children().remove();
    //Table Head
    $("#iplist").empty();
    for (var each of ipaddresses) {
        $("#iplist").append("<a id = '" + each + "' class='dropdown-item' id='memberjoinpackets' href='#' onclick=\"ban('" + each + "', 'unknown')\">" + each + "</a>")
    }
    $("#iplist").append("<a id = 'clearbans' class='dropdown-item' id='memberjoinpackets' href='#' onclick=\"clearbans()\">Clear bans</a>")

    if (memberjoin == false) {
        var content =  `<table class='table table-striped table-hover table-bordered ' class='players'>
                        <tbody>
                        <thead class='thead-dark'>
                            <tr>
                                <th class='rank'>Rank</th>
                                <th>Name</th>
                                <th>Hours</th>
                                <th>Acc Age</th>
                                <th>VAC</th>
                                <th>Location</th>
                                <th>IP</th>
                                <th>Last seen</th>
                                <th>test</th>
                            </tr>
                        </thead>`;
        for (player of data) {
            if (player.memberjoin == false) {
                $("#" + player.ip).append("hi")

                content += '<tr class="' + player.partyID + '">'
                //Player Rank
                content += '<td class="rank"><img src="http://mw2.adie.space/images/ranks/' + rank(player) + '.png" class="rank"><div class="level">' + (parseInt(player.level) + 1) + '</div></td>'
                //Player Name
                content += "<td class='name" + checkban(player) + "'><a class='dropdown-toggle " + playerhost(player) + "' href='#' role='button' id='dropdownMenuLink' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><span>" + escape(player.personaname) + "</span></a>";
                content += "<div class='dropdown-menu' aria-labelledby='dropdownMenuLink'>";
                var text = `${player.steamid}\\n${strip(player.personaname)}\\n${player.ip}`;
                content += "<a class='dropdown-item' href='" + player.profileurl + "' target='_blank'>View Profile</a>";
                content += "<a class='dropdown-item' href='#' onclick=\"copyTextToClipboard('" + text + "')\">Copy</a>";

                if ((player.banned == null) || (player.banned == "False")) {
                    content += "<a class='dropdown-item' href='#' onclick=\"ban('" + player.ip + "', '"+strip(player.personaname)+"')\">Ban</a></div></td>";
                } else {
                    content += "<a class='dropdown-item' href='#' onclick=\"unban('" + player.ip + "', '"+strip(player.personaname)+"')\">Unban</a></div></td>";
                }

                //Player Hours
                if (player.communityvisibilitystate == 3) {
                    if (player.mw2hours == 0) {
                        content += '<td class="hours">-</td>';
                    } else {
                        content += '<td class="hours">' + player.mw2hours + '</td>';
                    }
                } else {
                    content += '<td class="hours">Private</td>';
                }
                if (player.timecreated == 0) {
                    content += '<td class="hours">Private</td>';
                } else if (Math.floor((Date.now()/1000-player.timecreated)/86400) > 365) {
                    if (Math.round((Date.now()/1000-player.timecreated)/86400/365) == 1) {
                        // ??
                    }
                    content += '<td class="hours">' + ((Date.now()/1000-player.timecreated)/86400/365).toFixed(1) + ' years</td>';
                } else {
                    content += '<td class="hours">' + Math.floor((Date.now()/1000-player.timecreated)/86400) + ' days</td>';
                }
                //Player VAC ban
                if (player.vacbanned == 1) {
                    if (player.vacbypass == 0) {
                        content += '<td class="vac"><div class="btn btn-success btn-sm">' + vac(player) + '</div></td>';
                    }
                    if (player.vacbypass == 1) {
                        content += '<td class="vac"><div class="btn btn-warning btn-sm">' + vac(player) + '</div></td>';
                    }
                    if (player.vacbypass == 2) {
                        content += '<td class="vac"><div class="btn btn-danger btn-sm">' + vac(player) + '</div></td>';
                    }
                } else {
                    content += '<td class="vac">' + vac(player) + '</td>';
                }
                //Player location
                if (player.ip == "0.0.0.0" || player.ip == "1.3.3.7" || player.ip == "127.0.0.1" || player.ip == "255.255.255.255") {
                    content += '<td class="location"><img src = http://mw2.adie.space/images/flags/' + player.countrycode + '.svg class="flag"><a href="#"><div class="btn btn-danger btn-sm">' + playerlocation(player) + '</div></a></td>';
                } else {
                    if (player.ip == player.memberjoinip || player.memberjoinip == null) {
                        content += '<td class="location"><img src = http://mw2.adie.space/images/flags/' + player.countrycode + '.svg class="flag">' + playerlocation(player) + '</a></td>';
                    } else {
                        content += '<td class="location"><img src = http://mw2.adie.space/images/flags/' + player.countrycode + '.svg class="flag"><div class="btn btn-danger btn-sm">' + playerlocation(player) + '</div></a></td>';
                    }
                }
                content += '<td class="ip">' + player.ip + '</td>';
                //Last Seen
                content += '<td class="lastseen">' + moment(player.lastseen * 1000).fromNow() + '</td>';
                $(("#" + (player.ip).replace(/\./g, '\\\.'))).append(" => " + escape(player.personaname));
                content += '<td><input type="text" class="form-control"></td>'
            }
        }
    } else {
        var content =  `<table class='table table-striped table-hover table-bordered ' class='players'>
        <tbody>
        <thead class='thead-dark'>
            <tr>
                <th>Name</th>
                <th>Actual IP</th>
                <th>Reported IP</th>
                <th>Last seen</th>
            </tr>
        </thead>`;
        for (player of data) {
            if (player.memberjoin == true) {
                content += "<td class='name" + checkban(player) + "'><a class='dropdown-toggle " + playerhost(player) + "' href='#' role='button' id='dropdownMenuLink' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><span>" + escape(player.personaname) + "</span></a>";
                content += "<div class='dropdown-menu' aria-labelledby='dropdownMenuLink'>";
                content += "<a class='dropdown-item' href='" + player.profileurl + "' target='_blank'>View Profile</a>";
                if (player.memberjoin != null) {
                    ipaddress = player.memberjoinip
                } else {
                    ipaddress = player.ip
                }
                if ((player.banned == null) || (player.banned == "False")) {
                    content += "<a class='dropdown-item' href='#' onclick=\"ban('" + ipaddress + "', '" + strip(player.personaname) + "')\">Ban</a></div></td>";
                } else {
                    content += "<a class='dropdown-item' href='#' onclick=\"unban('" + ipaddress + "', '" + strip(player.personaname) + "')\">Unban</a></div></td>";
                }
                if (player.ip == player.memberjoinip || player.memberjoinip == null) {
                content += '<td>' + player.memberjoinip + '</td>';
                content += '<td>' + player.ip + '</td>';
                } else {
                content += '<td>' + player.memberjoinip + '</td>';
                content += '<td><div class="btn btn-danger btn-sm">' + player.ip + '</div></td>';
                }
                content += '<td class="lastseen">' + moment(player.lastseen * 1000).fromNow() + '</td>';
                content += '</tr>'
            }
        }
        content += '</tr>'
    }
    content += "</table>"

    function nothing() {
        return;
    }

    $('#playertable').append(content);
    $("a.host").append(' <span class="badge badge-info">host</span>')
    $("#host").html("<a class='dropdown-toggle host' href='#' role='button' id='dropdownMenuLink' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><span>" + host + "</span></a><div class='dropdown-menu' aria-labelledby='dropdownMenuLink'><a class='dropdown-item' href='#' onclick=\"ban('" + host + "', '" + host + "')\">Ban</a>");
    $("#apicalls").html(apicalls + " api calls")
    $("#partystatepackets").html(partystatepackets + "  partystatepackets")
    $("#memberjoinpackets").html(memberjoinpackets + " memberjoin packets")

    //apply party colours
    var color = 0;
    var parties = [];
    var colors = ["table-info", "table-warning", "table-success", "table-primary", "table-danger"];
    for (i = 0; i < data.length - 1; i++) {
        if (data[i]["partyID"] == data[i + 1]["partyID"] && data[i]["partyID"] != 1) {
            parties.indexOf(data[i]["partyID"]) === -1 ? parties.push(data[i]["partyID"]) : nothing();
        }
    }
    parties.forEach(function(element) {
        $('tr.'+ element).addClass(colors[color]);
        color++;
        if (color == colors.length) {
            color = 0;
        }
    });
}

function nothing() {
    return;
}

function escape(args) {
    if ("string" !== typeof args) {
        return "";
    }
    if ("" == args.replace(/\^[0-9]/g, "").replace(/ /g, "")) {
        return "Unnamed player";
    }
    args = args.replace(/&/g, "&amp;");
    args = args.replace(/>/g, "&gt;");
    args = args.replace(/</g, "&lt;");
    args = args.replace(/'/g, "\&apos;");
    args = args.replace(/"/g, "\&quot;");
    var s = "<span>";
    var i = 0;
    for (; i < args.length; i++) {
        if ("^" == args[i] && args[i + 1]) {
            var checked = args.charCodeAt(i + 1);
            if (48 <= checked && 57 >= checked) {
                s += '</span><span class="color' + args[i + 1] + '">';
                i++;
            } else {
                s += args[i];
            }
        } else {
            s += args[i];
        }
    }
    s = (s + "</span>").replace(/<span><\/span>/g, "");
    return s = s.replace(/<span class=\"color[0-9]\"><\/span>/g, "");
}

function strip(args) {
    if ("string" !== typeof args) {
        return "";
    }
    if ("" == args.replace(/\^[0-9]/g, "").replace(/ /g, "")) {
        return "Unnamed player";
    }
    args = args.replace(/&/g, "");
    args = args.replace(/>/g, "");
    args = args.replace(/</g, "");
    args = args.replace(/'/g, "\\&apos;");
    args = args.replace(/"/g, "\\&quot;");
    var i = 0;
    s = ""
    for (; i < args.length; i++) {
        if ("^" == args[i] && args[i + 1]) {
            var checked = args.charCodeAt(i + 1);
            if (48 <= checked && 57 >= checked) {
                i++;
            } else {
                s += args[i];
            }
        } else {
            s += args[i];
        }
    }
    return s;
}

function ban(ip, name) {
    if (confirm("Are you sure you want to kick " + name)) {
        $.ajax("/?action=ban&ip=" + ip + "&csrf=" + csrf);
        setTimeout(function() {
            reload();
        }, 125);
    }
}

function unban(ip, name) {
    if (confirm("Are you sure you want to unban " + name)) {
        $.ajax("/?action=unban&ip=" + ip + "&csrf=" + csrf);
        setTimeout(function() {
            reload();
        }, 125);
    }
}

function clearbans() {
    if (confirm("Are you sure you want to clear all bans?")) {
        $.ajax("/?action=clearbans" + "&csrf=" + csrf);
        setTimeout(function() {
            reload();
        }, 125);

    }
}

setInterval(function() {
    reload();
}, 30 * 1000);

function memberjointoggle() {
    if (memberjoin == false) {
        memberjoin = true;
    } else {
        memberjoin = false;
    }
    reload();
}

function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a
    // flash, so some of these are just precautions. However in
    // Internet Explorer the element is visible whilst the popup
    // box asking the user for permission for the web page to
    // copy to the clipboard.
    //

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        console.log('Oops, unable to copy');
    }
    document.body.removeChild(textArea);
}

setTimeout(function() {
    reload();
}, 425);

$(document).ready(function () {
    $('.dropdown-toggle').dropdown();
});