using System;
using System.Collections.Generic;
using System.Net;

namespace FakeMW2SA
{
    class Program
    {
        public static Object thisLock = new Object();
        public static string MyExternalIP;
        public static string LatestVersion;
        public static string MOTD;
        public static List<PlayerModel> players = new List<PlayerModel>();
        public static int playerID = 0;
        public static int apicalls = 0;
        public static int partystatecount = 0;
        public static int memberjoincount = 0;
        public static long port = 28962;
        public static int csrf = new Random().Next();
        public static List<string> ipaddresses = new List<string>();
        public static int ipindex = 0;
        public static Version CurrentVersion = new Version(typeof(Program).Assembly.GetName().Version.ToString());
        public static void InitialWebCalls()
        {
            using (WebClient client = new WebClient())
            {
                try
                {
                    MyExternalIP = client.DownloadString("http://icanhazip.com").Trim();
                }
                catch (WebException e)
                {
                    Console.WriteLine(e.Message);
                    MyExternalIP = "0.0.0.0";
                }
            }
            Console.WriteLine("last place to be");
        }
        public static void Addipaddress(string item)
        {
            lock (thisLock)
            {
                //insert IP address into the beginning of the list, if the list grows to 300, remove the last 10
                ipaddresses.Insert(0, item);
                if (ipaddresses.Count >= 300)
                {
                    ipaddresses.RemoveRange(290, 10);
                }
            }

        }
        static void Main(string[] args)
        {
            Console.WriteLine("start");
            if (args.Length > 0)
            {
                Int64.TryParse(args[0], out port);
            }
            Console.Title = "FakeMW2SA Version " + typeof(Program).Assembly.GetName().Version.ToString();
            HttpClient.Start();
            Sniffer.Start();
            WriteOnBottomLine("0");
            Console.WriteLine("before that here marker");
            InitialWebCalls();
            Console.WriteLine("we are here marker");
        }
        public static string playersinpacket = "0";
        //This function writes some statistics to the bottom of the cmd winndow
        public static void WriteOnBottomLine(string text)
        {
            if (text == "memberjoin")
            {
                memberjoincount += 1;
            }
            else if (text == "partystate")
            {
                partystatecount += 1;
            }
            else if (text == "apicalls")
            {
                apicalls += 1;
            }
            else
            {
                playersinpacket = text + "  ";
            }
            int x = Console.CursorLeft;
            int y = Console.CursorTop;
            Console.CursorTop = Console.WindowTop + Console.WindowHeight - 1;
            Console.Write("Partystate packets: {0} | Memberjoin packets: {1} | Api calls: {2} | Players in last partystate: {3}", partystatecount, memberjoincount, apicalls, playersinpacket);
            // Restore previous position
            Console.SetCursorPosition(x, y);
        }
    }
}