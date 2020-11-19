using System;
using System.Collections.Generic;
using System.Linq;

namespace FakeMW2SA
{
    public class PlayerModel
    {
        public PlayerModel(string ipaddress, string steamid, bool memberjoin)
        {
            this.steamid = steamid;
            this.memberjoin = memberjoin;
            ip = ipaddress;
            TimeSpan t = DateTime.UtcNow - new DateTime(1970, 1, 1);
            lastseen = Utils.GetEpochSeconds();
        }
        public bool host { get; set; }
        public bool memberjoin { get; set; }
        public bool updated { get; set; } = false;
        public int personastate { get; set; }
        public int vacbanned { get; set; }
        public int numberofvacbans { get; set; }
        public int dateoflastban { get; set; }
        public int lastseen { get; set; }
        public int playerprimaryid { get; set; }
        public int unknown1 { get; set; }
        public int unknown2 { get; set; }
        public int partyID { get; set; }
        public int lastupdated { get; set; }
        public int vacbypass { get; set; } = 2;
        public string steamid { get; set; }
        public string personaname { get; set; }
        public string profileurl { get; set; }
        public string country { get; set; }
        public string lobby { get; set; }
        public string ip { get; set; }
        public string banned { get; set; }
    }
    public class JsonOutput
    {
        public JsonOutput()
        {
            try
            {
                if (Program.ipaddresses.Count > 0)
                {
                    host = Program.ipaddresses.GroupBy(i => i).OrderByDescending(grp => grp.Count()).Select(grp => grp.Key).First();
                    ipaddresses = Program.ipaddresses.Distinct().ToList();
                }
            }
            catch
            {
                
            }
        }
        public List<string> ipaddresses { get; set; }
        public List<PlayerModel> players { get; set; } = Program.players;
        public string host { get; set; } = "0.0.0.0";
        public int apicalls { get; set; } = Program.apicalls;
        public int partystatecount { get; set; } = Program.partystatecount;
        public int memberjoincount { get; set; } = Program.memberjoincount;
    }
}