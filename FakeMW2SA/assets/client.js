
function reload()
{
    // ? https://api.jquery.com/jQuery.ajax/ > var jqxhr = $.ajax("example.php").done(function() {
    jsonresponse = $.ajax("/?action=players").done(function ()
    {
        // https://api.jquery.com/jQuery.ajax/ > responseJSON
        data = jsonresponse.responseJSON["players"];
        host = jsonresponse.responseJSON["host"];
        ipaddresses = jsonresponse.responseJSON["ipaddresses"];

        var partygroups = [];

        for (i = 0; i < data.length; i++)
        {
            var temp = data.filter(function (a)
            {
                return (a.partyID == i);
            });

            if (temp[0] != null)
            {
                lastseens = [];
                temp2 = [];

                temp.forEach(function (item)
                {
                    lastseens.push(item.lastseen);
                });

                biggest = Math.max(...lastseens);

                temp.forEach(function (item)
                {
                    if (item.lastseen != biggest)
                    {
                        item.partyID = 0;
                        partygroups.push([item]);
                    }
                    else
                    {
                        temp2.push(item);
                    }
                });

                if (temp2.length > 0)
                {
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

        data = newdata;

        populate();
    })
}

function vac(player) {
    if (player.vacbanned == 1) {
        return "VAC (" + player.numberofvacbans + ") " + Math.floor((new Date).getTime() / 86400000 - player.dateoflastban / 86400) + "d";
    }
    else {
        return "False";
    }
}

function playerlocation(player) {
    result = "";
    if (player.country != null) {
        result += player.country;
    }
    return result;
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

function populate()
{
    $('#playertable').children().remove();

    var content = `
        <table class="table table-striped table-hover table-bordered" class="players">
            <thead style="background-color:silver">
                <tr>
                    <th>Name</th>
                    <th>VAC</th>
                    <th>Location</th>
                    <th>IP</th>
                    <th>Last seen</th>
                </tr>
            </thead>`;

    for (player of data)
    {
        if (player.memberjoin == false)
        {
            content += "<tr class='" + player.partyID + "'>";

            // player name
            content += "<td class='name " + checkban(player) + "'><a class='dropdown-toggle " + playerhost(player) + "' href='#' role='button' id='dropdownMenuLink' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'><span>" + escape(player.personaname) + "</span></a>";
            // dropdown
            content += "<div class='dropdown-menu' aria-labelledby='dropdownMenuLink'>";
            // view profile
            content += "<a class='dropdown-item' href='" + player.profileurl + "' target='_blank'>Profile</a>";
            // copy user info content
            var text = `${player.steamid}\\n${strip(player.personaname)}\\n${player.ip}`;
            // copy user info button
            content += "<a class='dropdown-item' href='#' onclick=copyTextToClipboard('" + text + "')>Copy</a>";
            // ban / unban
            if ((player.banned == null) || (player.banned == "False")) {
                content += "<a class='dropdown-item' href='#' onclick=\"ban('" + player.ip + "')\">Ban</a></div></td>";
            } else {
                content += "<a class='dropdown-item' href='#' onclick=\"unban('" + player.ip + "')\">Unban</a></div></td>";
            }

            // player VAC ban
            if (player.vacbanned == 1)
            {
                if (player.vacbypass == 0)
                {
                    content += '<td class="vac"><button style="background-color: green">' + vac(player) + '</button></td>';
                }
                if (player.vacbypass == 1)
                {
                    content += '<td class="vac"><div class="btn btn-warning btn-sm">' + vac(player) + '</div></td>';
                }
                if (player.vacbypass == 2)
                {
                    content += '<td class="vac"><div class="btn btn-danger btn-sm">' + vac(player) + '</div></td>';
                }
            }
            else
            {
                content += '<td class="vac"><button style="background-color:lightblue">' + vac(player) + '</button></td>';
            }

            //Player location
            if (player.ip == "0.0.0.0" || player.ip == "1.3.3.7" || player.ip == "127.0.0.1" || player.ip == "255.255.255.255") {
                content += '<td class="location"><div class="btn btn-danger btn-sm">' + playerlocation(player) + '</div></td>';
            } else {
                if (player.ip == player.memberjoinip || player.memberjoinip == null) {
                    content += '<td class="location">' + playerlocation(player) + '</td>';
                } else {
                    content += '<td class="location"><div class="btn btn-danger btn-sm">' + playerlocation(player) + '</div></td>';
                }
            }
            content += '<td class="ip">' + player.ip + '</td>';
            //Last Seen
            content += '<td class="lastseen">' + moment(player.lastseen * 1000).fromNow() + '</td>';
            $(("#" + (player.ip).replace(/\./g, '\\\.'))).append(" => " + escape(player.personaname));
        }
    }

    content += '</table>';

    function nothing() {
        return;
    }

    $('#playertable').append(content);

    //tag the host
    $("a.host").append('<span class="badge badge-info">host</span>');

    //apply party colours
    var color = 0;
    var parties = [];
    var colors = ["table-info", "table-warning", "table-success", "table-primary", "table-danger"];

    for (i = 0; i < data.length - 1; i++)
    {
        if (data[i]["partyID"] == data[i + 1]["partyID"] && data[i]["partyID"] != 1)
        {
            parties.indexOf(data[i]["partyID"]) === -1 ? parties.push(data[i]["partyID"]) : nothing();
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

$(document).ready(function () {
    $('.dropdown-toggle').dropdown();
});