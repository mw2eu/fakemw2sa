using Newtonsoft.Json;
using System;
using System.Net;
using System.Threading;
using System.Web;

namespace FakeMW2SA
{
    public static class HttpResponseExtentions
    {
        public static void WriteResponse(this HttpListenerResponse response, string content, string mimeType = null)
        {
            byte[] buffer = System.Text.Encoding.UTF8.GetBytes(content);
            response.ContentLength64 = buffer.Length;
            if (!string.IsNullOrEmpty(mimeType))
            {
                response.ContentType = mimeType;
            }
            System.IO.Stream output = response.OutputStream;
            output.Write(buffer, 0, buffer.Length);
        }
    }
    class HttpClient
    {
        public static void Run()
        {
            if (!HttpListener.IsSupported)
            {
                Console.WriteLine("Windows XP SP2 or Server 2003 is required to use the HttpListener class.");
                return;
            }
            try
            {
                var localhostURI = "http://localhost:" + Program.port + "/";
                HttpListener listener = new HttpListener();
                listener.Prefixes.Add(localhostURI);
                listener.Start();
                //Console.WriteLine("Listening on " + localhostURI);
                while (true)
                {
                    string responseString = Utils.ReadEmbeddedResrourceAsString("index.html");
                    responseString = responseString.Replace("#URL#", localhostURI);
                    HttpListenerContext context = listener.GetContext();
                    HttpListenerRequest request = context.Request;
                    HttpListenerResponse response = context.Response;
                    string clientIP = context.Request.RemoteEndPoint.ToString();

                    response.AppendHeader("Access-Control-Allow-Origin", "*");
                    if (request.Url?.Segments.Length > 2 && request.Url?.Segments[1] == "assets/")
                    {
                        var assetName = request.Url?.Segments[1] + request.Url?.Segments[2];
                        responseString = Utils.ReadEmbeddedResrourceAsString(assetName.Replace("/", "."));
                        var mimeType = MimeMapping.GetMimeMapping(assetName);
                        response.WriteResponse(responseString, mimeType);
                        continue;
                    }
                    else if (request.QueryString.GetValues("action") != null)
                    {
                        var action = request.QueryString.GetValues("action")[0];
                        switch (action)
                        {
                            case "ban":
                                Utils.Block(request.QueryString.GetValues("ip")[0], true);
                                break;

                            case "unban":
                                Utils.Block(request.QueryString.GetValues("ip")[0], false);
                                break;

                            case "host":
                                responseString = JsonConvert.SerializeObject(new JsonOutput());
                                break;

                            case "players":
                                response.ContentType = "application/json";
                                responseString = JsonConvert.SerializeObject(new JsonOutput());
                                break;

                            default:
                                break;
                        }
                    }
                    response.WriteResponse(responseString);
                }
            }
            catch (HttpListenerException)
            {
                Console.WriteLine("Unable to open the application on port " + Program.port + "/");
                Console.WriteLine("Press any key to exit.");
                Console.ReadKey();
                Environment.Exit(1);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
        }
        public static void Start()
        {
            Thread a = new Thread(Run);
            a.Start();
        }
    }
}
