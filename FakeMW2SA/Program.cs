using System;
using System.Collections.Generic;
using System.Net;

namespace FakeMW2SA
{
    class Program
    {
        public static Object thisLock = new Object();
        public static string MyExternalIP;
        public static List<PlayerModel> players = new List<PlayerModel>();
        public static int playerID = 0;
        public static int apicalls = 0;
        public static int partystatecount = 0;
        public static long port = 28962;
        public static List<string> ipaddresses = new List<string>();
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
            Console.Title = "FakeMW2SA Version " + typeof(Program).Assembly.GetName().Version.ToString();
            HttpClient.Start();
            Sniffer.Start();
            InitialWebCalls();
        }
    }
}