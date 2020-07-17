
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

function ban(ip) {
    $.ajax("/?action=ban&ip=" + ip);
    setTimeout(function () {
        reload();
    }, 125);
}

function unban(ip) {
    $.ajax("/?action=unban&ip=" + ip);
    setTimeout(function () {
        reload();
    }, 125);
}

function submitmessage(messagevar) {
    $.ajax("/?action=message&messagetext=" + messagevar);
    console.log(messagevar)
    setTimeout(function () {
        reload();
    }, 125);
}

function vacban(player) {
    let result = ""
    if (player.vacbanned == 1) {
        result += "("
        result += player.numberofvacbans
        result += ") "
        result += Math.floor((new Date).getTime() / 86400000 - player.dateoflastban / 86400)
        result += "d"
    } else {
        result += "False"
    }
    return result
}

function playerlocation(player) {
    let result = ""
    if (player.country != null) {
        result += player.country
    }
    return result
}

function checkban(player) {
    if (player.banned == "True") {
        return "bg-danger"
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

function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
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

function populate() {
    $("#playertable tbody").children().remove();

    var content = "";

    for (player of playersdata) {
        if (player.memberjoin == false) {
            content += "<tr class='" + player.partyID + "'>";

            // player name
            content += "<td class='name' "
            if (player.banned == "True") {
                content += "style='background-color:darksalmon'"
            }
            content += "><a class='dropdown-toggle "
            content += playerhost(player)
            content += "' href='#' role='button' id='dropdownMenuLink' data-toggle='dropdown'><span>"
            content += escape(player.personaname)
            content += "</span></a>"

            // dropdown
            content += "<div class='dropdown-menu' aria-labelledby='dropdownMenuLink'>";
            // view profile
            content += "<a class='dropdown-item' href='" + player.profileurl + "' target='_blank'>Profile</a>";
            // copy user info
            content += "<a class='dropdown-item' href='#' onclick=copyTextToClipboard('";
            content += `${player.steamid}\\n${strip(player.personaname)}\\n${player.ip}`;
            content += "')>Copy</a>";
            // ban / unban
            if ((player.banned == null) || (player.banned == "False")) {
                content += "<a class='dropdown-item' href='#' onclick=\"ban('" + player.ip + "')\">Ban</a></div></td>";
            } else {
                content += "<a class='dropdown-item' href='#' onclick=\"unban('" + player.ip + "')\">Unban</a></div></td>";
            }

            // player VAC ban
            if (player.vacbanned == 1) {
                if (player.vacbypass == 0) {
                    colorvac = "lightgreen";
                } else if (player.vacbypass == 1) {
                    colorvac = "lightpink";
                } else if (player.vacbypass == 2) {
                    colorvac = "lightcoral";
                }
            } else {
                colorvac = "lightblue";
            }
            content += "<td class='vac'><button style='background-color:";
            content += colorvac;
            content += "'>";
            content += vacban(player)
            content += "</button></td>";

            // player location
            content += '<td class="location">' + playerlocation(player) + '</td>'

            // player ip
            content += '<td class="ip">' + player.ip + '</td>';

            // player seen
            content += '<td class="lastseen">' + moment(player.lastseen * 1000).fromNow() + '</td>';
            $(("#" + (player.ip).replace(/\./g, '\\\.'))).append(" => " + escape(player.personaname));
        }
    }

    function nothing() {
        return;
    }

    $("#playertable tbody").append(content);

    //tag the host
    $("a.host").append('<span class="badge badge-info">host</span>');

    //apply party colours
    var color = 0;
    var parties = [];
    var colors = ["table-info", "table-warning", "table-success", "table-primary", "table-danger"];

    for (i = 0; i < playersdata.length - 1; i++) {
        if (playersdata[i]["partyID"] == playersdata[i + 1]["partyID"] && playersdata[i]["partyID"] != 1) {
            parties.indexOf(playersdata[i]["partyID"]) === -1 ? parties.push(playersdata[i]["partyID"]) : nothing();
        }
    }

    parties.forEach(function (element) {
        $('tr.' + element).addClass(colors[color]);
        color++;
        if (color == colors.length) {
            color = 0;
        }
    });
}

function reload() {
    // ? https://api.jquery.com/jQuery.ajax/
    // var jqxhr = $.ajax("example.php").done(function () {
    jsonresponse = $.ajax("/?action=players").done(function () {
        // https://api.jquery.com/jQuery.ajax/ > responseJSON
        playersdata = jsonresponse.responseJSON["players"];
        host = jsonresponse.responseJSON["host"];
        ipaddresses = jsonresponse.responseJSON["ipaddresses"];
        message = jsonresponse.responseJSON["message"];

        var partygroups = [];

        for (i = 0; i < playersdata.length; i++) {
            var temp = playersdata.filter(function (a) {
                return (a.partyID == i);
            });

            if (temp[0] != null) {
                lastseens = [];
                temp2 = [];

                temp.forEach(function (item) {
                    lastseens.push(item.lastseen);
                });

                biggest = Math.max(...lastseens);

                temp.forEach(function (item) {
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
            array.sort(function (a, b) {
                return (b.lastseen - a.lastseen);
            });
        }

        partygroups.forEach(sortem);

        partygroups.sort(function (a, b) {
            return (b[0].lastseen - a[0].lastseen);
        })

        newdata = []
        for (a = 0; a < partygroups.length; a++) {
            for (i = 0; i < partygroups[a].length; i++) {
                newdata.push(partygroups[a][i]);
            }
        }

        playersdata = newdata;

        populate();
    });
}

$(document).ready(function () {
    $('.dropdown-toggle').dropdown();
});