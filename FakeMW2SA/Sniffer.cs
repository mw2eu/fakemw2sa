using System;
using System.Collections.Generic;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;
using PacketDotNet;
using SharpPcap;

namespace FakeMW2SA
{
    class Sniffer
    {
        public static List<string> localipaddresses = new List<string>();
        private const int ReadTimeoutMilliseconds = 5000;
        public static void Run()
        {
            try
            {
                var devices = CaptureDeviceList.Instance;
                if (devices.Count < 1)
                {
                    throw new Exception("error: related: devices, instances, < 1, no interface, npcap installed?");
                }
                foreach (SharpPcap.Npcap.NpcapDevice dev in devices)
                {
                    //Write each device to the console.
                    Console.WriteLine("{0}", dev.Description);
                    
                    foreach (SharpPcap.LibPcap.PcapAddress addr in dev.Addresses)
                    {
                        if (addr.Addr != null && addr.Addr.ipAddress != null)
                        {
                            localipaddresses.Add(addr.Addr.ipAddress.ToString());
                        }
                    }
                }
                foreach (var device in devices)
                {
                    if (device == null) continue;
                    device.OnPacketArrival += DeviceOnOnPacketArrival;
                    device.Open(DeviceMode.Promiscuous, ReadTimeoutMilliseconds);
                    // tcpdump filter to capture only game packets
                    device.Filter = "udp and port 28960";
                    Action action = device.Capture;
                    action.BeginInvoke(ar => action.EndInvoke(ar), null);
                }
            }
            catch(DllNotFoundException)
            {
                Console.WriteLine("No interfaces found! Make sure Npcap is installed.");
                Console.WriteLine("https://nmap.org/npcap/");
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(1);
            }
        }
        public static void DeviceOnOnPacketArrival(object sender, CaptureEventArgs captureEventArgs)
        {
            int numberofplayers = 0;
            var packet = Packet.ParsePacket(captureEventArgs.Packet.LinkLayerType, captureEventArgs.Packet.Data);
            var eth = (EthernetPacket)packet;
            var PacketPayloadInHex = BitConverter.ToString(eth.Bytes).Replace("-", string.Empty);
            var DestIP = new IPAddress(long.Parse(Utils.ReverseBytes(PacketPayloadInHex.Substring(60, 8)), System.Globalization.NumberStyles.AllowHexSpecifier)).ToString();
            var SourceIP = new IPAddress(long.Parse(Utils.ReverseBytes(PacketPayloadInHex.Substring(52, 8)), System.Globalization.NumberStyles.AllowHexSpecifier)).ToString();

            if (!localipaddresses.Contains(SourceIP))
            {
                Program.Addipaddress(SourceIP);
            }

            // hex to ascii > 70617274797374617465 = partystate
            // the partystate packet contains a lot of information including player name, steam ID, reported IP, and score information
            if (PacketPayloadInHex.Contains(@"70617274797374617465")) 
            {
                //Program.WriteOnBottomLine("partystate"); //incriment the console partystate count by one
                Program.partystatecount += 1;
                Console.WriteLine("Partystate packets: " + Program.partystatecount);

                Utils.SetHost(SourceIP);
                string playerpatern = @"0{10}.{40}0{48}.{28}";
                MatchCollection matches2;
                Regex playerregex = new Regex(playerpatern);
                matches2 = playerregex.Matches(PacketPayloadInHex);
                var IDlist = new List<string>();
                for (int ctr = 0; ctr < matches2.Count; ctr++)
                {
                    IDlist.Add(long.Parse(Utils.ReverseBytes(matches2[ctr].Value.Substring(10, 16)), System.Globalization.NumberStyles.HexNumber).ToString());
                }
                for (int ctr = 0; ctr < matches2.Count; ctr++)
                {                    
                    var partystatesteamid = long.Parse(Utils.ReverseBytes(matches2[ctr].Value.Substring(10, 16)), System.Globalization.NumberStyles.HexNumber).ToString();
                    var partystateip = new IPAddress(long.Parse(Utils.ReverseBytes(matches2[ctr].Value.Substring(34, 8)), System.Globalization.NumberStyles.AllowHexSpecifier)).ToString();
                    
                    PlayerModel player;

                    //Search the list of players with a matching steam ID
                    if ((Program.players.Find(x => x.steamid == partystatesteamid) == null))
                    {
                        //If the player isn't found, we're going to add them to the list of players, and increment the playerID variable for the next player
                        player = new PlayerModel(partystateip, partystatesteamid, false) { playerprimaryid = Program.playerID };
                        Program.playerID++;
                        Program.players.Add(player);
                    }
                    else
                    {
                        player = Program.players.Find(x => x.steamid == partystatesteamid);
                    }
                    if ((Program.players.Find(x => x.unknown1 == int.Parse(matches2[ctr].Value.Substring(98, 8), System.Globalization.NumberStyles.HexNumber)) == null))
                    {
                        player.partyID = Utils.FindPartyID();
                    }
                    else
                    {
                        if (int.Parse(matches2[ctr].Value.Substring(98, 8), System.Globalization.NumberStyles.HexNumber) == 0)
                        {
                            player.partyID = Utils.FindPartyID();
                        }
                        else
                        {
                            player.partyID = (Program.players.Find(x => x.unknown1 == int.Parse(matches2[ctr].Value.Substring(98, 8), System.Globalization.NumberStyles.HexNumber))).partyID;
                        }
                    }
                    TimeSpan t = DateTime.UtcNow - new DateTime(1970, 1, 1);
                    int secondsSinceEpoch = (int)t.TotalSeconds;
                    player.updated = false;
                    player.lastupdated = Utils.GetEpochSeconds();

                    numberofplayers += 1;

                    //these two bytes are used in the party ID
                    player.unknown1 = int.Parse(matches2[ctr].Value.Substring(98, 8), System.Globalization.NumberStyles.HexNumber);
                    player.unknown2 = int.Parse(Utils.ReverseBytes(matches2[ctr].Value.Substring(106, 8)), System.Globalization.NumberStyles.HexNumber);
                }

                // old: Program.WriteOnBottomLine(numberofplayers.ToString());
                Console.WriteLine("Players in last partystate: " + numberofplayers.ToString());

                // extracted all the player information from the packet as needed, going to call on external web APIs to obtain more information
                Utils.CallApis();
            }
        }
        public static void Start()
        {
            Thread a = new Thread(Run);
            a.Start();
        }
    }
}