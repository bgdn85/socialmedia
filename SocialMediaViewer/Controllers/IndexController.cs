using System.Configuration;
using System.Threading;
using System.Web.Mvc;
using SocialMediaViewer.Models;

namespace SocialMediaViewer.Controllers
{
    public class IndexController : Controller
    {
        //
        // GET: /Index/

        public ActionResult Index()
        {
            var viewModel = new AppViewModel
            {
                UserDetails = Session["UserDetails"] as UserDetailsViewModel
            };

            return View(viewModel);
        }

    }
}
