
function submitmessage(messagevar) {
    fetch("/?action=message&messagetext=" + messagevar);
    console.log(messagevar)
}

function ban(ip) {
    fetch("/?action=ban&ip=" + ip);
    reload();
}

function unban(ip) {
    fetch("/?action=unban&ip=" + ip);
    reload();
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

function playerhost(player) {
    if (player.host == true) {
        return "host";
    } else {
        return "";
    }
}

function populate() {
    //$("#playertable").children().remove();
    while (playertable.firstChild) {
        playertable.removeChild(playertable.firstChild);
    }

    var content = "";

    for (player of playersdata) {
        if (player.memberjoin == false) {
            content += "<tr>";

            // player name with link to Steam profile
            content += "<td><a target='_blank' href='";
            content += player.profileurl;
            content += "'><span>";
            content += escape(player.personaname)
            content += "</span></a>"
            content += "<button style='background-color:mediumpurple'>";
            content += playerhost(player);
            content += "</button>";
            content += "</td>";

            // player ip
            content += "<td>";
            content += player.ip;
            content += "</td>";

            // player location
            content += "<td>";
            content += playerlocation(player);
            content += "</td>";

            // player seen
            content += "<td>";
            content += lastseen(); // moment(player.lastseen * 1000).fromNow();
            content += "</td>";
            $(("#" + (player.ip).replace(/\./g, '\\\.'))).append(" => " + escape(player.personaname));

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
            content += "<td><button style='background-color:";
            content += colorvac;
            content += "'>";
            content += vacban(player)
            content += "</button></td>";

            // Info > Copy (copies some information to the clipboard of the os)
            content += "<td><button onclick=copyTextToClipboard('";
            //content += `${player.steamid}\\n${strip(player.personaname)}\\n${player.ip}`;
            content += "https://steamcommunity.com/profiles/";
            content += player.steamid;
            content += "\\n";
            content += player.ip;
            content += "')>Copy</button></td> ";

            // Block > Add/Delete
            content += "<td>";
            if ((player.banned == null) || (player.banned == "False")) {
                content += "<button onclick=\"ban('"
                content += player.ip
                content += "')\">Add</button>"
            } else {
                content += "<button onclick=\"unban('"
                content += player.ip
                content += "')\">Delete</button>"
            }
            content += "</td>";

            content += "</tr>";
        }
    }

    function lastseen() {
        var d = new Date();
        var epoch = Math.round(d.valueOf() / 1000);
        var dif = epoch - player.lastseen;
        return dif + " sec ago";
    }

    function nothing() {
        return;
    }

    //$("#playertable").append(content);
    playertable.innerHTML += content;

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