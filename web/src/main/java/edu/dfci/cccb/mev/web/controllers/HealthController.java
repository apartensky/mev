/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package edu.dfci.cccb.mev.web.controllers;

import static org.springframework.web.bind.annotation.RequestMethod.GET;

import javax.inject.Inject;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.fasterxml.jackson.annotation.JsonProperty;

import edu.dfci.cccb.mev.dataset.domain.r.RDispatcher;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Parameter;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.R;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Result;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;

/**
 * @author levk
 *
 */
@Controller
@RequestMapping ({ "/health" })
@Log4j
public class HealthController {
    
  private @Inject RDispatcher r;
  
  @R (synchronize = true, value = "function (param) list (p = param)")
  public static class J {
    private @Parameter String param = "hello";

    public static class R {
      private @Getter @JsonProperty String p;
    }

    private @Getter @Result R r;
  }
    
  @ResponseBody  
  @RequestMapping (method = GET)
  public String health (Model model) throws Exception {    
	  J j = new J ();
	  
	  r.execute (j);
	  if(!"hello".equals(j.getR ().getP ())) {
		  throw new Exception("Rserve health check failed");
	  };
	  return "hello";
	  
  }
}
