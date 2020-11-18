using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;

namespace FakeMW2SA
{
    class Utils
    {
        public static void RunCommand(string command)
        {
            Process cmd = new Process();
            cmd.StartInfo.FileName = "cmd.exe";
            cmd.StartInfo.RedirectStandardInput = true;
            cmd.StartInfo.RedirectStandardOutput = true;
            cmd.StartInfo.CreateNoWindow = true;
            cmd.StartInfo.UseShellExecute = false;
            cmd.Start();
            cmd.StandardInput.Flush();
            cmd.StandardInput.WriteLine(command);
            cmd.StandardInput.Flush();
            cmd.StandardInput.Close();
            cmd.WaitForExit();
        }
        public static void Unban(string ip)
        {
            if (ip.Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries).Length == 4)
            {
                var players = Program.players.FindAll(x => x.ip == ip);
                foreach (PlayerModel player in players)
                {
                    player.banned = "False";
                }
                string banRemove = "route delete " + ip + " 0.0.0.0";
                Console.WriteLine(banRemove);
                RunCommand(banRemove);
            }
        }
        public static void Ban(string ip)
        {
            if (ip.Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries).Length == 4)
            {
                var players = Program.players.FindAll(x => x.ip == ip);
                foreach (PlayerModel player in players)
                {
                    player.banned = "True";
                }
                string banAdd = "route add " + ip + " 0.0.0.0 IF 1";
                Console.WriteLine(banAdd);
                RunCommand(banAdd);
            }

        }
        public static int GetEpochSeconds()
        {
            TimeSpan t = DateTime.UtcNow - new DateTime(1970, 1, 1);
            return (int)t.TotalSeconds;
        }
        public static string ReverseBytes(string val)
        {
            var Result = "";
            for (int i = val.Count(); i > 0; i = i - 2)
            {
                Result = Result + val.Substring(i - 2, 2);
            }
            return Result;
        }
        //This is for UTF-8 compatibility
        public static string ConvertHex(String hexString)
        {
            try
            {
                string ascii = string.Empty;

                for (int i = 0; i < hexString.Length; i += 2)
                {
                    String hs = string.Empty;

                    hs = hexString.Substring(i, 2);
                    uint decval = Convert.ToUInt32(hs, 16);
                    char character = Convert.ToChar(decval);
                    ascii += character;

                }
                return ascii;
            }
            catch (Exception ex)
            {
                Console.WriteLine(hexString);
                Console.WriteLine(ex.Message);
            }
            return string.Empty;
        }
        public static byte[] StringToByteArray(String hex)
        {
            int NumberChars = hex.Length / 2;
            byte[] bytes = new byte[NumberChars];
            using (var sr = new StringReader(hex))
            {
                for (int i = 0; i < NumberChars; i++)
                {
                    bytes[i] = Convert.ToByte(new string(new char[2] { (char)sr.Read(), (char)sr.Read() }), 16);
                }
            }
            return bytes;
        }
        public static void SetHost(string SourceIP) //This function doesn't really work reliably, especially if we are host
        {
            foreach (PlayerModel each in Program.players)
            {
                each.host = false;
            }
            if ((Program.players.Find(x => x.ip == SourceIP && x.memberjoin == false) != null))
            {
                (Program.players.Find(x => x.ip == SourceIP)).host = true;
            }
            else if ((Program.players.Find(x => x.ip == Program.MyExternalIP) != null))
            {
                (Program.players.Find(x => x.ip == Program.MyExternalIP)).host = true;
            }
        }
        public static int FindPartyID()
        {
            for (int i = 1; i <= 1000; i++)
            {
                if ((Program.players.Find(x => x.partyID == i)) == null)
                {
                    return i;
                }
            }
            return 999;
        }
        public static void CallApis()
        {
            string SteamIDs = "";
            string Ipaddresses = "";
            List<PlayerModel> playerstolookup = new List<PlayerModel>();
            foreach (PlayerModel each in Program.players)
            {
                //If we don't have the player name OR they're not a memberjoin packet and they're not updated and they haven't been seen within 60 seconds
                //put them in the player lookup queue, and set them to "updated"
                if (each.personaname == null || (each.memberjoin == false && each.updated == false && GetEpochSeconds() - 60 > each.lastseen))
                {
                    playerstolookup.Add(each);
                    each.updated = true;
                }
            }
            //We're going through the list of players to look up, and concatting the steamIDs and IPaddresses to use as arguments in the API
            foreach (PlayerModel each in playerstolookup) { SteamIDs = SteamIDs + each.steamid + ","; }
            foreach (PlayerModel each in playerstolookup) { Ipaddresses = Ipaddresses + each.ip + ","; }
            if (playerstolookup.Count > 0)
            {
                //This is a caching API proxy I wrote and run. It's used both to prevent this program from bugging steam too much, and also to keep my API key safe.
                //see https://mw2.adie.space/lookup.php?steamids=76561198036680398 for an example of the JSON output.
                string url = "https://mw2.adie.space/lookup.php?steamids=" + SteamIDs.TrimEnd(',') + "&ips=" + Ipaddresses.TrimEnd(',');
                try
                {
                    using (WebClient wc = new WebClient())
                    {
                        wc.Encoding = System.Text.Encoding.UTF8;
                        int backgroundapicalls = Int32.Parse(JObject.Parse(wc.DownloadString(url))["0"]["apicalls"].ToString());
                        Program.apicalls = Program.apicalls + backgroundapicalls;
                        using (IEnumerator<JToken> enumerator2 = ((IEnumerable<JToken>)JObject.Parse(wc.DownloadString(url))["response"]["players"]).GetEnumerator())
                        {
                            while (enumerator2.MoveNext())
                            {
                                JToken each = enumerator2.Current;
                                PlayerModel player = Program.players.Find((PlayerModel x) => x.steamid == each["steamid"].ToString());
                                if (each["communityvisibilitystate"].Type != JTokenType.Null)
                                {
                                    player.communityvisibilitystate = Convert.ToInt32(each["communityvisibilitystate"]);
                                }
                                if (each["profilestate"].Type != JTokenType.Null)
                                {
                                    player.profilestate = Convert.ToInt32(each["profilestate"]);
                                }
                                if (each["personaname"].Type != JTokenType.Null)
                                {
                                    player.personaname = each["personaname"].ToString();
                                }
                                if (each["profileurl"].Type != JTokenType.Null)
                                {
                                    player.profileurl = each["profileurl"].ToString();
                                }
                                if (each["avatarfull"].Type != JTokenType.Null)
                                {
                                    player.avatarfull = each["avatarfull"].ToString();
                                }
                                if (each["personastate"].Type != JTokenType.Null)
                                {
                                    player.personastate = Convert.ToInt32(each["personastate"]);
                                }
                                if (each["timecreated"].Type != JTokenType.Null)
                                {
                                    player.timecreated = Convert.ToInt32(each["timecreated"].ToString());
                                }
                                if (each["communitybanned"].Type != JTokenType.Null)
                                {
                                    player.communitybanned = Convert.ToInt32(each["communitybanned"]);
                                }
                                if (each["vacbanned"].Type != JTokenType.Null)
                                {
                                    player.vacbanned = Convert.ToInt32(each["vacbanned"]);
                                }
                                if (each["numberofvacbans"].Type != JTokenType.Null)
                                {
                                    player.numberofvacbans = Convert.ToInt32(each["numberofvacbans"]);
                                }
                                if (each["dateoflastban"].Type != JTokenType.Null)
                                {
                                    player.dateoflastban = Convert.ToInt32(each["dateoflastban"]);
                                }
                                if (each["numberofgamebans"].Type != JTokenType.Null)
                                {
                                    player.numberogamebans = Convert.ToInt32(each["numberofgamebans"]);
                                }
                                if (each["mw2hours"].Type != JTokenType.Null)
                                {
                                    player.mw2hours = Convert.ToInt32(each["mw2hours"]);
                                }
                                if (each["csgohours"].Type != JTokenType.Null)
                                {
                                    player.csgohours = Convert.ToInt32(each["csgohours"]);
                                }
                                if (each["cssourcehours"].Type != JTokenType.Null)
                                {
                                    player.cssourcehours = Convert.ToInt32(each["cssourcehours"]);
                                }
                                if (each["lastseen"].Type != JTokenType.Null)
                                {
                                    player.lastseen = GetEpochSeconds();
                                }
                                if (each["country"].Type != JTokenType.Null)
                                {
                                    player.country = each["country"].ToString();
                                }
                                if (each["vacbypass"].Type != JTokenType.Null)
                                {
                                    player.vacbypass = Convert.ToInt32(each["vacbypass"]);
                                }
                            }
                        }
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                    Console.WriteLine(url);
                }
            }
        }
        public static string ReadEmbeddedResrourceAsString(string resourceName)
        {
            var assembly = Assembly.GetExecutingAssembly();
            try
            {
                using (Stream stream = assembly.GetManifestResourceStream($"FakeMW2SA.{resourceName}"))
                {
                    if (stream == null)
                    {
                        return string.Empty;
                    }
                    using (StreamReader reader = new StreamReader(stream))
                    {
                        return reader.ReadToEnd();
                    }
                }
            }
            catch
            {
                return string.Empty;
            }
        }
    }
}